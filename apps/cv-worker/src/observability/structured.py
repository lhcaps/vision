from __future__ import annotations

import os
import sys
import time
from contextlib import contextmanager
from typing import TYPE_CHECKING, Generator, Optional

from loguru import logger as _loguru_logger

if TYPE_CHECKING:
    from fastapi import Request

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

# Remove default handler and configure structured output
_loguru_logger.remove()

_loguru_logger.add(
    sys.stderr,
    level=LOG_LEVEL,
    format=(
        "{time:YYYY-MM-DDTHH:mm:ss.SSSZ} | {level: <7} | "
        "{name}:{function}:{line} | "
        "{extra[correlation_id]:-36} | "
        "{extra[job_id]:-36} | "
        "{message}"
    ),
    colorize=False,
)

#: Context variable for correlation ID (propagated from API via x-correlation-id header)
correlation_id_var: "contextvars.ContextVar[Optional[str]]"
job_id_var: "contextvars.ContextVar[Optional[str]]"

try:
    import contextvars

    correlation_id_var = contextvars.ContextVar("correlation_id", default=None)
    job_id_var = contextvars.ContextVar("job_id", default=None)
except ImportError:
    # Python < 3.7 fallback — correlation won't propagate, but app won't crash
    correlation_id_var = None  # type: ignore[assignment]
    job_id_var = None  # type: ignore[assignment]


@contextmanager
def request_context(
    correlation_id: Optional[str], job_id: Optional[str] = None
) -> Generator[None, None, None]:
    """Bind correlation_id and job_id to the current async context for structured logging."""
    if correlation_id_var is not None:
        token1 = correlation_id_var.set(correlation_id or "-")
    else:
        token1 = None

    if job_id_var is not None:
        token2 = job_id_var.set(job_id or "-")
    else:
        token2 = None

    try:
        yield
    finally:
        if token1 is not None:
            correlation_id_var.reset(token1)  # type: ignore[arg-type]
        if token2 is not None:
            job_id_var.reset(token2)  # type: ignore[arg-type]


def get_correlation_id() -> Optional[str]:
    return correlation_id_var.get() if correlation_id_var else None


def get_job_id() -> Optional[str]:
    return job_id_var.get() if job_id_var else None


def log_info(msg: str, **kwargs: object) -> None:
    _loguru_logger.info(msg, **kwargs)


def log_warning(msg: str, **kwargs: object) -> None:
    _loguru_logger.warning(msg, **kwargs)


def log_error(msg: str, **kwargs: object) -> None:
    _loguru_logger.error(msg, **kwargs)


def log_exception(msg: str, **kwargs: object) -> None:
    _loguru_logger.exception(msg, **kwargs)


def log_debug(msg: str, **kwargs: object) -> None:
    _loguru_logger.debug(msg, **kwargs)


class RequestLogger:
    """FastAPI middleware-compatible request logger with timing and correlation ID."""

    @staticmethod
    def log_request_received(request: "Request") -> float:
        start = time.perf_counter()
        _loguru_logger.info(
            "Request received",
            method=request.method,
            path=request.url.path,
            correlation_id=get_correlation_id() or "-",
            job_id=get_job_id() or "-",
        )
        return start

    @staticmethod
    def log_request_completed(
        request: "Request",
        status_code: int,
        start: float,
    ) -> None:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        if status_code >= 500:
            _loguru_logger.error(
                "Request completed",
                method=request.method,
                path=request.url.path,
                status_code=status_code,
                duration_ms=duration_ms,
                correlation_id=get_correlation_id() or "-",
                job_id=get_job_id() or "-",
            )
        elif status_code >= 400:
            _loguru_logger.warning(
                "Request completed",
                method=request.method,
                path=request.url.path,
                status_code=status_code,
                duration_ms=duration_ms,
                correlation_id=get_correlation_id() or "-",
                job_id=get_job_id() or "-",
            )
        else:
            _loguru_logger.info(
                "Request completed",
                method=request.method,
                path=request.url.path,
                status_code=status_code,
                duration_ms=duration_ms,
                correlation_id=get_correlation_id() or "-",
                job_id=get_job_id() or "-",
            )

    @staticmethod
    def log_request_failed(
        request: "Request",
        start: float,
        error: str,
    ) -> None:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        _loguru_logger.exception(
            "Request failed",
            method=request.method,
            path=request.url.path,
            duration_ms=duration_ms,
            correlation_id=get_correlation_id() or "-",
            job_id=get_job_id() or "-",
            error=error,
        )
