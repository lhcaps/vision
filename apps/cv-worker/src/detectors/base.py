from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Detection:
    """A single object detection from a detector."""

    asset_id: str
    label: str | None = None
    label_class_id: str | None = None
    x: float = 0.0
    y: float = 0.0
    width: float = 0.0
    height: float = 0.0
    confidence: float = 1.0
    metadata: dict[str, Any] = field(default_factory=dict)
    _class_id: int | None = field(default=None, repr=False)

    def to_dict(self) -> dict[str, Any]:
        d = {
            "assetId": self.asset_id,
            "geometry": {
                "x": self.x,
                "y": self.y,
                "width": self.width,
                "height": self.height,
            },
            "confidence": round(self.confidence, 4),
            "metadata": self.metadata,
        }
        if self.label_class_id is not None:
            d["labelClassId"] = self.label_class_id
        if self.label is not None:
            d["label"] = self.label
        return d


class Detector(ABC):
    """Abstract base class for object detectors."""

    @property
    @abstractmethod
    def mode(self) -> str:
        """Human-readable detector mode string (e.g. 'mock_detector', 'onnx_detector')."""

    @abstractmethod
    def detect(self, asset_id: str, image_path: str, width: int, height: int) -> list[Detection]:
        """Run detection on a single image.

        Args:
            asset_id: The asset identifier.
            image_path: Filesystem path to the image file.
            width: Original image width in pixels.
            height: Original image height in pixels.

        Returns:
            List of Detection objects.
        """

    @abstractmethod
    def close(self) -> None:
        """Release any resources held by the detector."""
