from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["capabilities"]["mockDetector"] is True


def test_mock_pipeline_returns_valid_geometry():
    response = client.post(
        "/cv/run-pipeline",
        json={
            "jobId": "job_test",
            "pipeline": {"version": 1, "nodes": [], "edges": []},
            "assets": [
                {
                    "assetId": "asset_1",
                    "storageKey": "projects/demo/originals/asset_1.jpg",
                    "width": 640,
                    "height": 360,
                }
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    prediction = body["predictions"][0]

    assert body["mode"] == "mock_detector"
    assert body["workerVersion"] == "0.2.0"
    assert prediction["geometry"]["x"] >= 0
    assert prediction["geometry"]["y"] >= 0
    assert prediction["geometry"]["x"] + prediction["geometry"]["width"] <= 640
    assert prediction["geometry"]["y"] + prediction["geometry"]["height"] <= 360


def test_mock_pipeline_keeps_tiny_image_geometry_bounded():
    response = client.post(
        "/cv/run-pipeline",
        json={
            "jobId": "job_tiny",
            "pipeline": {"version": 1, "nodes": [], "edges": []},
            "assets": [
                {
                    "assetId": "asset_tiny",
                    "storageKey": "projects/demo/originals/tiny.jpg",
                    "width": 18,
                    "height": 20,
                }
            ],
        },
    )

    assert response.status_code == 200
    geometry = response.json()["predictions"][0]["geometry"]
    assert geometry["x"] >= 0
    assert geometry["y"] >= 0
    assert geometry["x"] + geometry["width"] <= 18
    assert geometry["y"] + geometry["height"] <= 20


def test_mock_pipeline_is_deterministic():
    payload = {
        "jobId": "job_stable",
        "pipeline": {"version": 1, "nodes": [], "edges": []},
        "confidenceThreshold": 0.5,
        "assets": [
            {
                "assetId": "asset_1",
                "storageKey": "projects/demo/originals/asset_1.jpg",
                "width": 640,
                "height": 360,
            }
        ],
    }

    first = client.post("/cv/run-pipeline", json=payload)
    second = client.post("/cv/run-pipeline", json=payload)

    assert first.status_code == 200
    assert first.json() == second.json()


def test_onnx_mode_never_silently_falls_back_to_mock():
    response = client.post(
        "/cv/run-pipeline",
        json={
            "jobId": "job_onnx",
            "detectorMode": "onnx",
            "pipeline": {"version": 1, "nodes": [], "edges": []},
            "assets": [
                {
                    "assetId": "asset_1",
                    "storageKey": "projects/demo/originals/asset_1.jpg",
                    "width": 640,
                    "height": 360,
                }
            ],
        },
    )

    assert response.status_code == 400
    assert "modelArtifactKey" in response.json()["detail"]


def test_evaluate_detections_computes_iou_metrics():
    response = client.post(
        "/cv/evaluate-detections",
        json={
            "jobId": "job_eval",
            "iouThreshold": 0.5,
            "predictions": [
                {
                    "assetId": "asset_1",
                    "labelClassId": "car",
                    "geometry": {"x": 10, "y": 10, "width": 100, "height": 80},
                    "confidence": 0.91,
                },
                {
                    "assetId": "asset_1",
                    "labelClassId": "car",
                    "geometry": {"x": 400, "y": 300, "width": 40, "height": 40},
                    "confidence": 0.7,
                },
            ],
            "groundTruth": [
                {
                    "assetId": "asset_1",
                    "labelClassId": "car",
                    "geometry": {"x": 12, "y": 12, "width": 98, "height": 78},
                }
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["truePositive"] == 1
    assert body["falsePositive"] == 1
    assert body["falseNegative"] == 0
    assert body["precision"] == 0.5
    assert body["recall"] == 1.0
    assert body["f1"] > 0.66


def test_thumbnail_contract_for_image_media():
    response = client.post(
        "/cv/create-thumbnail",
        json={
            "jobId": "thumb_job_1",
            "assetId": "asset_1",
            "storageKey": "projects/demo/originals/asset_1.jpg",
            "targetKey": "projects/demo/derivatives/asset_1/thumb.webp",
            "mimeType": "image/jpeg",
            "width": 1920,
            "height": 1080,
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["status"] == "SUCCEEDED"
    assert body["derivative"]["type"] == "THUMBNAIL"
    assert body["derivative"]["storageKey"] == "projects/demo/derivatives/asset_1/thumb.webp"


def test_health_includes_logging_info():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "logging" in data
    assert data["logging"]["level"] == "INFO"
    assert data["logging"]["correlationIdPropagation"] is True
    assert data["logging"]["structuredOutput"] is True


def test_correlation_id_propagation():
    import uuid

    test_correlation_id = str(uuid.uuid4())
    response = client.get("/health", headers={"x-correlation-id": test_correlation_id})
    assert response.status_code == 200
    assert response.headers.get("x-correlation-id") == test_correlation_id
    data = response.json()
    assert data.get("correlationId") == test_correlation_id


def test_frame_extraction_rejects_image_media():
    response = client.post(
        "/cv/extract-frames",
        json={
            "jobId": "frame_job_1",
            "assetId": "asset_1",
            "storageKey": "projects/demo/originals/asset_1.jpg",
            "targetKey": "projects/demo/derivatives/asset_1/frames.json",
            "mimeType": "image/jpeg",
        },
    )

    assert response.status_code == 400
