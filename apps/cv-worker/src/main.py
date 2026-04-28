from __future__ import annotations

import hashlib
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="VisionFlow CV Worker", version="0.1.0")


class AssetInput(BaseModel):
    assetId: str
    storageKey: str
    width: int = Field(gt=0)
    height: int = Field(gt=0)


class RunPipelineRequest(BaseModel):
    jobId: str
    pipeline: dict[str, Any]
    modelArtifactKey: str | None = None
    assets: list[AssetInput]


class MediaProcessingRequest(BaseModel):
    jobId: str
    assetId: str
    storageKey: str
    targetKey: str
    mimeType: str
    width: int | None = Field(default=None, gt=0)
    height: int | None = Field(default=None, gt=0)


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "visionflow-cv-worker"}


@app.post("/cv/run-pipeline")
def run_pipeline(req: RunPipelineRequest) -> dict[str, Any]:
    if not req.assets:
        raise HTTPException(status_code=400, detail="No assets provided")

    predictions = [_mock_prediction(req.jobId, asset) for asset in req.assets]

    return {
        "jobId": req.jobId,
        "mode": "mock_detector",
        "predictionCount": len(predictions),
        "predictions": predictions,
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
    width = max(36, asset.width // 5)
    height = max(32, asset.height // 6)
    max_x = max(1, asset.width - width)
    max_y = max(1, asset.height - height)
    x = int.from_bytes(digest[:2], "big") % max_x
    y = int.from_bytes(digest[2:4], "big") % max_y
    confidence = 0.62 + (digest[4] / 255) * 0.33

    return {
        "assetId": asset.assetId,
        "labelClassId": None,
        "geometry": {
            "type": "bbox",
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
