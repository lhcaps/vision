from __future__ import annotations

import hashlib

from .base import Detection, Detector


class MockDetector(Detector):
    """Deterministic mock detector for development/testing without ONNX runtime.

    Produces a single deterministic bounding box per asset, derived from a SHA-256
    hash of jobId and assetId so the output is stable across runs.
    """

    def __init__(self) -> None:
        pass

    @property
    def mode(self) -> str:
        return "mock_detector"

    def detect(self, asset_id: str, image_path: str, width: int, height: int) -> list[Detection]:
        # image_path is accepted for interface compatibility but not used in mock mode.
        del image_path  # noqa: ARG002

        # Deterministic geometry from hash of asset_id
        digest = hashlib.sha256(asset_id.encode("utf-8")).digest()
        box_w = min(width, max(36, width // 5, 1))
        box_h = min(height, max(32, height // 6, 1))
        max_x = max(0, width - box_w)
        max_y = max(0, height - box_h)
        x = 0 if max_x == 0 else int.from_bytes(digest[:2], "big") % (max_x + 1)
        y = 0 if max_y == 0 else int.from_bytes(digest[2:4], "big") % (max_y + 1)
        confidence = round(0.62 + (digest[4] / 255) * 0.33, 3)

        return [
            Detection(
                asset_id=asset_id,
                x=x,
                y=y,
                width=box_w,
                height=box_h,
                confidence=confidence,
                metadata={"runtime": "mock_detector"},
            )
        ]

    def close(self) -> None:
        pass
