"""MinIO storage client for the CV worker.

Provides read/write access to MinIO object storage for source assets
and derivative artifacts. The worker never writes to PostgreSQL — only
MinIO operations here.
"""

from __future__ import annotations

import hashlib
import os
from typing import TYPE_CHECKING, Tuple

if TYPE_CHECKING:
    from minio import Minio
    from minio.datatypes import Object

BUCKET = os.environ.get("MINIO_BUCKET", "visionflow-artifacts")

_client: "Minio | None" = None


def get_client() -> "Minio":
    """Lazily initialise and return the MinIO client singleton."""
    global _client
    if _client is None:
        from minio import Minio

        endpoint = os.environ.get("MINIO_ENDPOINT", "localhost")
        port = os.environ.get("MINIO_PORT", "9000")
        _client = Minio(
            endpoint=f"{endpoint}:{port}",
            access_key=os.environ.get("MINIO_ACCESS_KEY", ""),
            secret_key=os.environ.get("MINIO_SECRET_KEY", ""),
            secure=os.environ.get("MINIO_USE_SSL", "false").lower() == "true",
        )
    return _client


def read_object(storage_key: str) -> Tuple[bytes, str]:
    """Read an object from MinIO.

    Args:
        storage_key: The object key within the configured bucket.

    Returns:
        A tuple of (bytes, content_type).

    Raises:
        FileNotFoundError: When the object does not exist in MinIO.
        RuntimeError: When MinIO returns an unexpected error.
    """
    client = get_client()
    try:
        response = client.get_object(BUCKET, storage_key)
        try:
            data = response.read()
        finally:
            response.close()
            response.release_conn()

        content_type = "application/octet-stream"
        if hasattr(response, "headers") and response.headers:
            content_type = response.headers.get("content-type", "application/octet-stream")

        return data, content_type
    except Exception as exc:  # noqa: BLE001
        exc_str = str(exc)
        if "NoSuchKey" in exc_str or "No such object" in exc_str or "404" in exc_str:
            raise FileNotFoundError(
                f"Object not found in MinIO bucket '{BUCKET}': {storage_key}"
            ) from exc
        raise RuntimeError(
            f"MinIO read error for '{storage_key}' in bucket '{BUCKET}': {exc}"
        ) from exc


def write_object(storage_key: str, data: bytes, content_type: str) -> None:
    """Write an object to MinIO.

    Args:
        storage_key: The object key to write to within the configured bucket.
        data: The byte content to write.
        content_type: The MIME type of the content.

    Raises:
        RuntimeError: When MinIO returns an error during write.
    """
    client = get_client()
    try:
        client.put_object(
            BUCKET,
            storage_key,
            data,
            len(data),
            content_type=content_type,
        )
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            f"MinIO write error for '{storage_key}' in bucket '{BUCKET}': {exc}"
        ) from exc


def object_exists(storage_key: str) -> bool:
    """Check whether an object exists in MinIO.

    Args:
        storage_key: The object key within the configured bucket.

    Returns:
        True if the object exists, False if the object is not found.

    Raises:
        RuntimeError: When MinIO is unreachable or credentials are invalid.
    """
    client = get_client()
    try:
        client.stat_object(BUCKET, storage_key)
        return True
    except Exception as exc:  # noqa: BLE001
        exc_str = str(exc)
        if "NoSuchKey" in exc_str or "No such object" in exc_str or "404" in exc_str:
            return False
        # Real infrastructure error — do not silently swallow connectivity/auth failures
        raise RuntimeError(
            f"MinIO connectivity or auth error while checking '{storage_key}' in bucket "
            f"'{BUCKET}': {exc}"
        ) from exc


def compute_sha256(data: bytes) -> str:
    """Compute the SHA-256 hex digest of the given bytes.

    Args:
        data: The byte content to hash.

    Returns:
        The SHA-256 hex digest string.
    """
    return hashlib.sha256(data).hexdigest()
