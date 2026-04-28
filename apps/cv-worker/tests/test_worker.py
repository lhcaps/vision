from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


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
    assert prediction["geometry"]["x"] >= 0
    assert prediction["geometry"]["y"] >= 0
    assert prediction["geometry"]["x"] + prediction["geometry"]["width"] <= 640
    assert prediction["geometry"]["y"] + prediction["geometry"]["height"] <= 360


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
