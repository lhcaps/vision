from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

WORKER_VERSION = "0.2.0"

app = FastAPI(title="VisionFlow CV Worker", version=WORKER_VERSION)


class AssetInput(BaseModel):
    assetId: str
    storageKey: str
    width: int = Field(gt=0)
    height: int = Field(gt=0)


class RunPipelineRequest(BaseModel):
    jobId: str
    pipeline: dict[str, Any]
    detectorMode: Literal["mock", "onnx"] = "mock"
    modelArtifactKey: str | None = None
    confidenceThreshold: float | None = Field(default=None, ge=0, le=1)
    assets: list[AssetInput]


class MediaProcessingRequest(BaseModel):
    jobId: str
    assetId: str
    storageKey: str
    targetKey: str
    mimeType: str
    width: int | None = Field(default=None, gt=0)
    height: int | None = Field(default=None, gt=0)


class BBoxGeometry(BaseModel):
    x: float = Field(ge=0)
    y: float = Field(ge=0)
    width: float = Field(gt=0)
    height: float = Field(gt=0)


class DetectionObject(BaseModel):
    assetId: str
    labelClassId: str | None = None
    geometry: BBoxGeometry
    confidence: float | None = Field(default=None, ge=0, le=1)


class EvaluateDetectionsRequest(BaseModel):
    jobId: str | None = None
    iouThreshold: float = Field(default=0.5, ge=0, le=1)
    predictions: list[DetectionObject]
    groundTruth: list[DetectionObject]


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "visionflow-cv-worker",
        "version": WORKER_VERSION,
        "capabilities": {
            "mockDetector": True,
            "onnxDetector": {
                "available": _onnx_runtime_available(),
                "mode": "explicit",
            },
            "evaluation": True,
        },
    }


@app.post("/cv/run-pipeline")
def run_pipeline(req: RunPipelineRequest) -> dict[str, Any]:
    if not req.assets:
        raise HTTPException(status_code=400, detail="No assets provided")

    if req.detectorMode == "onnx":
        return _run_onnx_pipeline(req)

    predictions = [_mock_prediction(req.jobId, asset) for asset in req.assets]

    if req.confidenceThreshold is not None:
        predictions = [
            prediction
            for prediction in predictions
            if prediction["confidence"] >= req.confidenceThreshold
        ]

    return {
        "jobId": req.jobId,
        "mode": "mock_detector",
        "workerVersion": WORKER_VERSION,
        "assetCount": len(req.assets),
        "predictionCount": len(predictions),
        "predictions": predictions,
        "warnings": [],
    }


@app.post("/cv/evaluate-detections")
def evaluate_detections(req: EvaluateDetectionsRequest) -> dict[str, Any]:
    matches = _match_detections(req.predictions, req.groundTruth, req.iouThreshold)
    true_positive = len(matches)
    false_positive = len(req.predictions) - true_positive
    false_negative = len(req.groundTruth) - true_positive
    precision = _safe_ratio(true_positive, true_positive + false_positive)
    recall = _safe_ratio(true_positive, true_positive + false_negative)
    f1 = _safe_ratio(2 * precision * recall, precision + recall)
    mean_iou = _safe_ratio(sum(match["iou"] for match in matches), true_positive)

    return {
        "jobId": req.jobId,
        "iouThreshold": req.iouThreshold,
        "truePositive": true_positive,
        "falsePositive": false_positive,
        "falseNegative": false_negative,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "meanIou": round(mean_iou, 4),
        "matches": matches,
    }


@app.post("/cv/create-thumbnail")
def create_thumbnail(req: MediaProcessingRequest) -> dict[str, Any]:
    if not req.mimeType.startswith("image/"):
        raise HTTPException(status_code=400, detail="Thumbnail jobs require image media")

    return {
        "jobId": req.jobId,
        "assetId": req.assetId,
        "status": "SUCCEEDED",
        "derivative": {
            "type": "THUMBNAIL",
            "storageKey": req.targetKey,
            "width": min(req.width or 512, 512),
            "height": min(req.height or 512, 512),
        },
        "metadata": {
            "runtime": "mock_thumbnailer",
            "sourceKey": req.storageKey,
        },
    }


@app.post("/cv/extract-frames")
def extract_frames(req: MediaProcessingRequest) -> dict[str, Any]:
    if not req.mimeType.startswith("video/"):
        raise HTTPException(status_code=400, detail="Frame extraction jobs require video media")

    return {
        "jobId": req.jobId,
        "assetId": req.assetId,
        "status": "SUCCEEDED",
        "derivative": {
            "type": "FRAME",
            "storageKey": req.targetKey,
            "frameCount": 12,
        },
        "metadata": {
            "runtime": "mock_frame_extractor",
            "sourceKey": req.storageKey,
        },
    }


def _mock_prediction(job_id: str, asset: AssetInput) -> dict[str, Any]:
    digest = hashlib.sha256(f"{job_id}:{asset.assetId}".encode("utf-8")).digest()
    width = min(asset.width, max(36, asset.width // 5, 1))
    height = min(asset.height, max(32, asset.height // 6, 1))
    max_x = max(0, asset.width - width)
    max_y = max(0, asset.height - height)
    x = 0 if max_x == 0 else int.from_bytes(digest[:2], "big") % (max_x + 1)
    y = 0 if max_y == 0 else int.from_bytes(digest[2:4], "big") % (max_y + 1)
    confidence = 0.62 + (digest[4] / 255) * 0.33

    return {
        "assetId": asset.assetId,
        "labelClassId": None,
        "geometry": {
            "x": x,
            "y": y,
            "width": width,
            "height": height,
        },
        "confidence": round(confidence, 3),
        "metadata": {
            "runtime": "mock_detector",
            "storageKey": asset.storageKey,
        },
    }


def _run_onnx_pipeline(req: RunPipelineRequest) -> dict[str, Any]:
    if not req.modelArtifactKey:
        raise HTTPException(
            status_code=400,
            detail="ONNX detector mode requires modelArtifactKey.",
        )

    if not _onnx_runtime_available():
        raise HTTPException(
            status_code=501,
            detail={
                "message": "ONNX detector mode is unavailable because onnxruntime is not installed.",
                "install": "pip install onnxruntime",
                "mode": "onnx_detector",
            },
        )

    model_path = Path(req.modelArtifactKey)

    if not model_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"ONNX model artifact not found: {req.modelArtifactKey}",
        )

    raise HTTPException(
        status_code=501,
        detail="ONNX runtime is available, but image tensor loading and YOLO post-processing are not configured for this V1 worker.",
    )


def _onnx_runtime_available() -> bool:
    try:
        import onnxruntime  # noqa: F401
    except ImportError:
        return False

    return True


def _match_detections(
    predictions: list[DetectionObject],
    ground_truth: list[DetectionObject],
    iou_threshold: float,
) -> list[dict[str, Any]]:
    matched_truth: set[int] = set()
    matches: list[dict[str, Any]] = []
    ranked_predictions = sorted(
        enumerate(predictions),
        key=lambda item: item[1].confidence if item[1].confidence is not None else 0,
        reverse=True,
    )

    for prediction_index, prediction in ranked_predictions:
        best_index: int | None = None
        best_iou = 0.0

        for truth_index, truth in enumerate(ground_truth):
            if truth_index in matched_truth:
                continue

            if not _can_match(prediction, truth):
                continue

            iou = _bbox_iou(prediction.geometry, truth.geometry)

            if iou > best_iou:
                best_iou = iou
                best_index = truth_index

        if best_index is not None and best_iou >= iou_threshold:
            matched_truth.add(best_index)
            matches.append(
                {
                    "predictionIndex": prediction_index,
                    "groundTruthIndex": best_index,
                    "assetId": prediction.assetId,
                    "iou": round(best_iou, 4),
                }
            )

    return matches


def _can_match(prediction: DetectionObject, truth: DetectionObject) -> bool:
    if prediction.assetId != truth.assetId:
        return False

    if prediction.labelClassId and truth.labelClassId:
        return prediction.labelClassId == truth.labelClassId

    return True


def _bbox_iou(a: BBoxGeometry, b: BBoxGeometry) -> float:
    left = max(a.x, b.x)
    top = max(a.y, b.y)
    right = min(a.x + a.width, b.x + b.width)
    bottom = min(a.y + a.height, b.y + b.height)
    intersection = max(0.0, right - left) * max(0.0, bottom - top)
    union = _bbox_area(a) + _bbox_area(b) - intersection

    return 0.0 if union == 0 else intersection / union


def _bbox_area(box: BBoxGeometry) -> float:
    return max(0.0, box.width) * max(0.0, box.height)


def _safe_ratio(numerator: float, denominator: float) -> float:
    return 0.0 if denominator == 0 else numerator / denominator
