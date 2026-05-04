from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

from .base import Detection, Detector

# ─── YOLOv8n COCO class names ────────────────────────────────────────────────

COCO_CLASSES: list[str] = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
    "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
    "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
    "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup",
    "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
    "toothbrush",
]


class OnnxRuntimeUnavailableError(RuntimeError):
    """Raised when onnxruntime cannot be imported."""


class ModelLoadError(RuntimeError):
    """Raised when the ONNX model cannot be loaded."""


class ImageDecodeError(RuntimeError):
    """Raised when an image cannot be decoded."""


@dataclass
class LetterboxResult:
    """Output of letterbox preprocessing."""

    tensor: np.ndarray  # shape: (1, 3, 640, 640), float32, normalized to [0, 1]
    scale: float  # scale factor from original to letterboxed
    pad_top: float
    pad_left: float
    original_width: int
    original_height: int


# ─── OnnxYoloDetector ────────────────────────────────────────────────────────

class OnnxYoloDetector(Detector):
    """YOLOv8n object detector using ONNX Runtime.

    Implements the VisionFlow ONNX detector contract:
    - Input: 640x640 letterboxed image
    - Preprocess: letterbox resize, normalize [0, 1], convert to NCHW float32
    - Inference: ONNX Runtime session
    - Postprocess: decode YOLOv8 output, apply confidence threshold, NMS,
      convert boxes back to original image coordinates
    - Output: list of Detection objects with BBoxGeometry-compatible coordinates
    """

    def __init__(
        self,
        model_path: str | Path,
        confidence_threshold: float = 0.25,
        nms_iou_threshold: float = 0.45,
        input_size: int = 640,
        model_version: str = "unknown",
    ) -> None:
        self._session = _load_onnx_session(model_path)
        self._input_size = int(input_size)
        self._conf_thresh = float(confidence_threshold)
        self._nms_iou_thresh = float(nms_iou_threshold)
        self._model_version = model_version
        self._input_name = self._session.get_inputs()[0].name
        self._output_names = [o.name for o in self._session.get_outputs()]

    @property
    def mode(self) -> str:
        return "onnx_detector"

    def detect(
        self,
        asset_id: str,
        image_path: str | Path,
        width: int,
        height: int,
    ) -> list[Detection]:
        img = _load_image(image_path)
        img_rgb = _to_rgb(img)
        lb = _letterbox_resize(img_rgb, self._input_size)
        tensor = _normalize_and_convert(lb.tensor, self._input_size)
        outputs = self._session.run(self._output_names, {self._input_name: tensor})
        detections = _postprocess_yolo(
            outputs=outputs,
            input_size=self._input_size,
            original_w=width,
            original_h=height,
            conf_thresh=self._conf_thresh,
            iou_thresh=self._nms_iou_thresh,
            scale=lb.scale,
            pad_top=lb.pad_top,
            pad_left=lb.pad_left,
        )
        for d in detections:
            d.asset_id = asset_id
            d.metadata["runtime"] = "onnx_detector"
            d.metadata["modelVersion"] = self._model_version
            d.metadata["inputSize"] = self._input_size
            d.metadata["cocoLabel"] = d.label
            d.metadata["classId"] = d._class_id
        return detections

    def close(self) -> None:
        self._session = None  # type: ignore[assignment]


# ─── ONNX session loading ────────────────────────────────────────────────────

def _load_onnx_session(model_path: str | Path) -> Any:
    try:
        import onnxruntime as ort  # noqa: N813
    except ImportError as exc:
        raise OnnxRuntimeUnavailableError(
            "onnxruntime is not installed. Install it with: pip install onnxruntime"
        ) from exc

    path = Path(model_path)
    if not path.exists():
        raise ModelLoadError(f"ONNX model not found at: {path}")

    providers = ["CPUExecutionProvider"]
    if "CUDAExecutionProvider" in ort.get_available_providers():
        providers.insert(0, "CUDAExecutionProvider")

    try:
        session = ort.InferenceSession(str(path), providers=providers)
    except Exception as exc:
        raise ModelLoadError(f"Failed to load ONNX model from {path}: {exc}") from exc

    return session


# ─── Image loading ──────────────────────────────────────────────────────────

def _load_image(path: str | Path) -> np.ndarray:
    try:
        from PIL import Image
    except ImportError as exc:
        raise ImageDecodeError(
            "Pillow is not installed. Install it with: pip install pillow"
        ) from exc

    try:
        img = Image.open(path)
        return np.array(img)
    except Exception as exc:
        raise ImageDecodeError(f"Failed to decode image '{path}': {exc}") from exc


def _to_rgb(img: np.ndarray) -> np.ndarray:
    if img.ndim == 2:
        return np.stack([img, img, img], axis=-1)
    if img.ndim == 3 and img.shape[2] == 4:
        from PIL import Image
        rgb = Image.fromarray(img).convert("RGB")
        return np.array(rgb)
    if img.shape[2] == 3:
        return img
    raise ImageDecodeError(f"Unexpected image shape: {img.shape}")


# ─── Letterbox preprocessing ────────────────────────────────────────────────

def _letterbox_resize(
    img: np.ndarray, target_size: int
) -> LetterboxResult:
    """Resize image to target_size while preserving aspect ratio using letterbox padding.

    Returns the resized tensor and metadata needed to convert predicted boxes back
    to original image coordinates.
    """
    img_rgb = _to_rgb(img)
    h, w = img_rgb.shape[:2]
    scale = target_size / max(h, w)
    new_h, new_w = int(round(h * scale)), int(round(w * scale))

    resized = _resize_image(img_rgb, (new_w, new_h))

    pad_h = target_size - new_h
    pad_w = target_size - new_w
    pad_top = pad_h // 2
    pad_left = pad_w // 2

    canvas = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
    canvas[pad_top : pad_top + new_h, pad_left : pad_left + new_w] = resized

    return LetterboxResult(
        tensor=canvas,
        scale=scale,
        pad_top=pad_top,
        pad_left=pad_left,
        original_width=w,
        original_height=h,
    )


def _resize_image(img: np.ndarray, target: tuple[int, int]) -> np.ndarray:
    try:
        from PIL import Image
    except ImportError:
        raise ImageDecodeError("Pillow is required for image resizing.")

    pil_img = Image.fromarray(img)
    resized = pil_img.resize(target, Image.BILINEAR)
    return np.array(resized)


def _normalize_and_convert(tensor: np.ndarray, target_size: int) -> np.ndarray:
    """Normalize [0, 255] -> [0, 1] and convert HWC -> NCHW float32."""
    normalized = tensor.astype(np.float32) / 255.0
    chw = np.transpose(normalized, (2, 0, 1))
    batch = np.expand_dims(chw, axis=0)
    return np.ascontiguousarray(batch)


# ─── YOLOv8 postprocessing ─────────────────────────────────────────────────

def _normalize_yolo_output(raw: np.ndarray) -> np.ndarray:
    """Normalize YOLOv8 ONNX output to (N, 84) shape for decode.

    Supported input shapes:
      - (1, 84, N) → squeeze batch → (84, N) → transpose → (N, 84)
      - (1, N, 84) → squeeze batch → (N, 84) → keep
      - (84, N)    → transpose → (N, 84)
      - (N, 84)    → keep → (N, 84)

    YOLOv8 always outputs 84 values per box: 4 (cx, cy, w, h) + 80 COCO classes.
    The feature dimension is always 84; we identify it by checking which axis = 84.
    """
    if raw.ndim == 3:
        raw = raw[0]  # (1, 84, N) or (1, N, 84) → (84, N) or (N, 84)

    if raw.ndim != 2:
        raise RuntimeError(
            f"Unexpected YOLOv8 output ndim {raw.ndim}. "
            "Expected 2-D or 3-D array."
        )

    # shape[0] == 84 means features are rows (YOLO output order: (84, N))
    # → transpose so features become columns: (N, 84)
    if raw.shape[0] == 84:
        return raw.T

    # shape[1] == 84 means features are cols already (N, 84) → keep
    if raw.shape[1] == 84:
        return raw

    raise RuntimeError(
        f"Unexpected YOLOv8 output shape {raw.shape}. "
        "Expected class dimension of 84 (4 box + 80 COCO classes)."
    )


def _postprocess_yolo(
    outputs: list[np.ndarray],
    input_size: int,
    original_w: int,
    original_h: int,
    conf_thresh: float,
    iou_thresh: float,
    scale: float,
    pad_top: float,
    pad_left: float,
) -> list[Detection]:
    """Decode YOLOv8 ONNX output and return Detection objects in original image coords."""

    if len(outputs) == 0:
        return []

    raw = _normalize_yolo_output(outputs[0])

    boxes: list[dict[str, Any]] = []

    for row in raw:
        class_scores = row[4:84]
        class_id = int(np.argmax(class_scores))
        confidence = float(class_scores[class_id])
        if confidence < conf_thresh:
            continue

        cx, cy, w, h = float(row[0]), float(row[1]), float(row[2]), float(row[3])

        letterbox_cx = cx - pad_left
        letterbox_cy = cy - pad_top

        orig_cx = letterbox_cx / scale
        orig_cy = letterbox_cy / scale
        orig_w = w / scale
        orig_h = h / scale

        x = max(0.0, min(orig_cx - orig_w / 2, original_w))
        y = max(0.0, min(orig_cy - orig_h / 2, original_h))
        w = max(0.0, min(orig_w, original_w - x))
        h = max(0.0, min(orig_h, original_h - y))

        if w <= 0 or h <= 0:
            continue

        boxes.append({
            "x": x,
            "y": y,
            "width": w,
            "height": h,
            "confidence": confidence,
            "class_id": class_id,
            "label": COCO_CLASSES[class_id] if class_id < len(COCO_CLASSES) else f"class_{class_id}",
        })

    kept = _nms(boxes, iou_thresh)

    detections: list[Detection] = []
    for b in kept:
        detections.append(
            Detection(
                asset_id="",
                label=b["label"],
                label_class_id=None,
                x=round(b["x"], 2),
                y=round(b["y"], 2),
                width=round(b["width"], 2),
                height=round(b["height"], 2),
                confidence=b["confidence"],
                _class_id=b["class_id"],
            )
        )

    return detections


def _nms(boxes: list[dict[str, Any]], iou_thresh: float) -> list[dict[str, Any]]:
    """Non-Maximum Suppression — removes overlapping lower-confidence boxes within same class."""
    if not boxes:
        return []

    sorted_boxes = sorted(boxes, key=lambda b: b["confidence"], reverse=True)
    keep: list[dict[str, Any]] = []

    for box in sorted_boxes:
        suppressed = False
        for kept_box in keep:
            if box.get("class_id") == kept_box.get("class_id"):
                if _box_iou(box, kept_box) >= iou_thresh:
                    suppressed = True
                    break
        if not suppressed:
            keep.append(box)

    return keep


def _box_iou(a: dict[str, Any], b: dict[str, Any]) -> float:
    """Compute IoU between two boxes in [x, y, w, h] format."""
    ax, ay, aw, ah = a["x"], a["y"], a["width"], a["height"]
    bx, by, bw, bh = b["x"], b["y"], b["width"], b["height"]

    left = max(ax, bx)
    top = max(ay, by)
    right = min(ax + aw, bx + bw)
    bottom = min(ay + ah, by + bh)

    inter_w = max(0.0, right - left)
    inter_h = max(0.0, bottom - top)
    inter_area = inter_w * inter_h

    area_a = max(0.0, aw) * max(0.0, ah)
    area_b = max(0.0, bw) * max(0.0, bh)
    union = area_a + area_b - inter_area

    return 0.0 if union <= 0 else inter_area / union
