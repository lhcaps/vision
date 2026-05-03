"""Real media processing: thumbnail generation via Pillow.

This module handles real media derivative creation. It reads source images
from MinIO, processes them, and writes derivatives back to MinIO.

CRITICAL: This module ONLY reads/writes MinIO. It has NO database access.
All database state transitions are owned by the NestJS API consumer.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Tuple

from PIL import Image

from .storage import compute_sha256, object_exists, read_object, write_object

THUMBNAIL_MAX_BOX = 512
THUMBNAIL_FORMAT = "WEBP"
THUMBNAIL_MIME = "image/webp"


@dataclass(frozen=True, slots=True)
class ThumbnailResult:
    """Result of a successful thumbnail generation operation."""

    type: str = "THUMBNAIL"
    storage_key: str
    width: int
    height: int
    checksum: str
    mime_type: str = THUMBNAIL_MIME


class SourceNotFoundError(Exception):
    """Raised when the source object does not exist in MinIO."""

    pass


class ImageDecodeError(Exception):
    """Raised when the source object cannot be decoded as an image."""

    pass


def create_thumbnail(source_key: str, target_key: str) -> ThumbnailResult:
    """Create a thumbnail derivative from a source image.

    Reads the source image from MinIO, scales it down to fit within a
    512x512 bounding box (preserving aspect ratio, no upscaling), converts
    to WebP, writes the derivative back to MinIO, and returns metadata.

    Args:
        source_key: MinIO object key for the source image.
        target_key: MinIO object key for the output thumbnail.

    Returns:
        ThumbnailResult with storage_key, width, height, checksum, mime_type.

    Raises:
        SourceNotFoundError: When the source object does not exist in MinIO.
        ImageDecodeError: When the source bytes cannot be decoded as an image.
        RuntimeError: When MinIO write fails.
    """
    # Check source existence first for a clear 404
    if not object_exists(source_key):
        raise SourceNotFoundError(
            f"Source object not found in MinIO: {source_key}"
        )

    data, _ = read_object(source_key)

    try:
        img = Image.open(BytesIO(data))
    except Exception as exc:
        raise ImageDecodeError(
            f"Failed to decode image from '{source_key}': {exc}"
        ) from exc

    try:
        # Force load to catch truncated/partial images early
        img.load()
        img = img.convert("RGB")

        w, h = img.size

        # Compute scaling: fit within 512x512, never upscale
        if w > THUMBNAIL_MAX_BOX or h > THUMBNAIL_MAX_BOX:
            scale = min(THUMBNAIL_MAX_BOX / w, THUMBNAIL_MAX_BOX / h)
            new_w = max(1, int(w * scale))
            new_h = max(1, int(h * scale))
            img = img.resize((new_w, new_h), Image.LANCZOS)

        # Save to WebP bytes
        output = BytesIO()
        img.save(output, format=THUMBNAIL_FORMAT, quality=85)
        output_bytes = output.getvalue()
        thumb_w, thumb_h = img.size
    finally:
        img.close()

    if not output_bytes:
        raise RuntimeError(
            f"Thumbnail encoding produced empty output for source '{source_key}'"
        )

    # Write derivative to MinIO
    write_object(target_key, output_bytes, THUMBNAIL_MIME)

    checksum = compute_sha256(output_bytes)

    return ThumbnailResult(
        storage_key=target_key,
        width=thumb_w,
        height=thumb_h,
        checksum=checksum,
    )
