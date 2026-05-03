from __future__ import annotations

import hashlib
import uuid
from pathlib import Path
from typing import Any, Literal, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from observability import (
    RequestLogger,
    get_correlation_id,
    get_job_id,
    log_error,
    log_exception,
    log_info,
    request_context,
)
from media_processing import (
    ImageDecodeError,
    SourceNotFoundError,
    create_thumbnail,
)

WORKER_VERSION = "0.2.0"

app = FastAPI(title="VisionFlow CV Worker", version=WORKER_VERSION)


# ─── Correlation ID middleware ──────────────────────────────────────────────────

@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-correlation-id") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id

    start = RequestLogger.log_request_received(request)

    with request_context(correlation_id):
        try:
            response = await call_next(request)
            response.headers["x-correlation-id"] = correlation_id
            RequestLogger.log_request_completed(request, response.status_code, start)
            return response
        except Exception as exc:  # noqa: BLE001
            RequestLogger.log_request_failed(request, start, str(exc))
            raise


# ─── Pydantic Models ──────────────────────────────────────────────────────────

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


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health(request: Request) -> dict[str, Any]:
    correlation_id: Optional[str] = getattr(request.state, "correlation_id", None)

    response: dict[str, Any] = {
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
            "thumbnail": {
                "available": True,
                "format": "WEBP",
                "maxBox": 512,
                "quality": 85,
                "runtime": "pillow",
            },
            "frameExtraction": {
                "available": False,
                "reason": "Deferred to Phase 17 follow-up after thumbnail verification",
            },
        },
        "logging": {
            "level": "INFO",
            "correlationIdPropagation": True,
            "structuredOutput": True,
        },
    }

    if correlation_id:
        response["correlationId"] = correlation_id

    return response


@app.post("/cv/run-pipeline")
def run_pipeline(req: RunPipelineRequest, request: Request) -> dict[str, Any]:
    correlation_id = getattr(request.state, "correlation_id", None)
    job_id = req.jobId

    with request_context(correlation_id, job_id):
        log_info(
            "Pipeline execution started",
            job_id=job_id,
            detector_mode=req.detectorMode,
            asset_count=len(req.assets),
        )

        if not req.assets:
            log_error("Pipeline rejected: no assets provided", job_id=job_id)
            raise HTTPException(status_code=400, detail="No assets provided")

        try:
            if req.detectorMode == "onnx":
                result = _run_onnx_pipeline(req)
            else:
                predictions = [_mock_prediction(job_id, asset) for asset in req.assets]

                if req.confidenceThreshold is not None:
                    predictions = [
                        p
                        for p in predictions
                        if p["confidence"] >= req.confidenceThreshold
                    ]

                result = {
                    "jobId": req.jobId,
                    "mode": "mock_detector",
                    "workerVersion": WORKER_VERSION,
                    "assetCount": len(req.assets),
                    "predictionCount": len(predictions),
                    "predictions": predictions,
                    "warnings": [],
                }

            log_info(
                "Pipeline execution completed",
                job_id=job_id,
                predictions_count=result.get("predictionCount", 0),
            )
            return result

        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001
            log_exception(
                "Pipeline execution failed",
                job_id=job_id,
                error=str(exc),
            )
            raise HTTPException(status_code=500, detail=str(exc))


@app.post("/cv/evaluate-detections")
def evaluate_detections(req: EvaluateDetectionsRequest, request: Request) -> dict[str, Any]:
    correlation_id = getattr(request.state, "correlation_id", None)
    job_id = req.jobId or "-"

    with request_context(correlation_id, job_id):
        log_info(
            "Evaluation started",
            job_id=job_id,
            prediction_count=len(req.predictions),
            ground_truth_count=len(req.groundTruth),
            iou_threshold=req.iouThreshold,
        )

        try:
            matches = _match_detections(req.predictions, req.groundTruth, req.iouThreshold)
            true_positive = len(matches)
            false_positive = len(req.predictions) - true_positive
            false_negative = len(req.groundTruth) - true_positive
            precision = _safe_ratio(true_positive, true_positive + false_positive)
            recall = _safe_ratio(true_positive, true_positive + false_negative)
            f1 = _safe_ratio(2 * precision * recall, precision + recall)
            mean_iou = _safe_ratio(
                sum(m["iou"] for m in matches), true_positive
            )

            result = {
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

            log_info(
                "Evaluation completed",
                job_id=job_id,
                true_positive=true_positive,
                false_positive=false_positive,
                false_negative=false_negative,
                f1=round(f1, 4),
            )
            return result

        except HTTPException:
            raise
        except Exception as exc:  # noqa: BLE001
            log_exception("Evaluation failed", job_id=job_id, error=str(exc))
            raise HTTPException(status_code=500, detail=str(exc))


@app.post("/cv/create-thumbnail")
def create_thumbnail_endpoint(req: MediaProcessingRequest, request: Request) -> dict[str, Any]:
    """Generate a real thumbnail derivative from a source image.

    The worker reads the source image from MinIO, creates a WebP thumbnail
    fitting within a 512x512 bounding box, writes the derivative back to MinIO,
    and returns the artifact metadata. This endpoint has NO database access.
    All state transitions are handled by the NestJS API consumer.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    job_id = req.jobId

    with request_context(correlation_id, job_id):
        log_info(
            "Thumbnail generation started",
            job_id=job_id,
            source_storage_key=req.storageKey,
            target_storage_key=req.targetKey,
            mime_type=req.mimeType,
        )

        if not req.mimeType.startswith("image/"):
            log_error(
                "Thumbnail generation rejected: invalid mime type",
                job_id=job_id,
                mime_type=req.mimeType,
            )
            raise HTTPException(
                status_code=400,
                detail="Thumbnail jobs require image media",
            )

        try:
            result = create_thumbnail(req.storageKey, req.targetKey)
            derivative = {
                "type": result.type,
                "storageKey": result.storage_key,
                "width": result.width,
                "height": result.height,
                "checksum": result.checksum,
                "mimeType": result.mime_type,
            }
            log_info(
                "Thumbnail generation completed",
                job_id=job_id,
                output_key=result.storage_key,
                width=result.width,
                height=result.height,
                checksum=result.checksum[:16] + "...",
            )
            return {
                "jobId": job_id,
                "assetId": req.assetId,
                "status": "SUCCEEDED",
                "derivative": derivative,
                "error": None,
            }

        except SourceNotFoundError as exc:
            log_error(
                "Thumbnail generation failed: source not found in MinIO",
                job_id=job_id,
                source_key=req.storageKey,
                error=str(exc),
            )
            raise HTTPException(
                status_code=404,
                detail=f"Source object not found: {req.storageKey}",
            )

        except ImageDecodeError as exc:
            log_error(
                "Thumbnail generation failed: image decode error",
                job_id=job_id,
                source_key=req.storageKey,
                error=str(exc),
            )
            raise HTTPException(
                status_code=400,
                detail=f"Image decode failed for '{req.storageKey}': {str(exc)[:120]}",
            )

        except Exception as exc:  # noqa: BLE001
            log_exception(
                "Thumbnail generation failed: unexpected error",
                job_id=job_id,
                source_key=req.storageKey,
                error=str(exc),
            )
            raise HTTPException(
                status_code=500,
                detail=f"Thumbnail generation failed: {str(exc)[:120]}",
            )


@app.post("/cv/extract-frames")
def extract_frames(req: MediaProcessingRequest, request: Request) -> dict[str, Any]:
    """Extract video frames — explicitly unsupported in Phase 17.

    Returns FAILED status with a clear error message. The NestJS consumer
    will transition the job to FAILED in the database. This stub exists
    so the API consumer always gets a structured response.

    Frame extraction will be implemented after the thumbnail path is
    verified end-to-end in Phase 17 follow-up.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    job_id = req.jobId

    with request_context(correlation_id, job_id):
        log_info(
            "Frame extraction called — explicitly unsupported",
            job_id=job_id,
            source_storage_key=req.storageKey,
            target_storage_key=req.targetKey,
            mime_type=req.mimeType,
        )

        if not req.mimeType.startswith("video/"):
            log_error(
                "Frame extraction rejected: invalid mime type",
                job_id=job_id,
                mime_type=req.mimeType,
            )
            raise HTTPException(
                status_code=400,
                detail="Frame extraction jobs require video media",
            )

        log_error(
            "Frame extraction is not yet implemented",
            job_id=job_id,
            source_key=req.storageKey,
        )
        return {
            "jobId": job_id,
            "assetId": req.assetId,
            "status": "FAILED",
            "frames": [],
            "frameCount": 0,
            "error": (
                "Frame extraction is not yet implemented. "
                "This feature requires OpenCV or ffmpeg dependencies and is deferred "
                "until the thumbnail processing path is verified end-to-end. "
                "The video file has been uploaded and stored; frame extraction "
                "will be added as a follow-up after Phase 17 thumbnail verification."
            ),
        }


# ─── Internal Helpers ─────────────────────────────────────────────────────────

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
