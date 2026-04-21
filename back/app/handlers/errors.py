"""FastAPI exception handlers that normalize every non-2xx response.

All handlers return a body conforming to `ErrorResponse`.
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import DivisionByZeroError, DomainError
from app.schemas.calculator import ErrorResponse


async def domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
    """Translate expected domain errors into HTTP 400 responses."""
    # DivisionByZeroError is currently the only concrete domain error but the
    # handler is generic so future domain errors map cleanly to 400.
    status_code = 400 if isinstance(exc, DivisionByZeroError) else 400
    body = ErrorResponse(error=exc.code, message=exc.message, details=None)
    return JSONResponse(status_code=status_code, content=body.model_dump())


async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Translate Pydantic validation errors into HTTP 422 responses."""
    body = ErrorResponse(
        error="validation_error",
        message="Invalid request.",
        details={"errors": exc.errors()},
    )
    # `mode="json"` ensures that any non-JSON-native values surfaced by
    # Pydantic (e.g. exception instances in `ctx`) are serialized safely.
    return JSONResponse(status_code=422, content=body.model_dump(mode="json"))


async def unexpected_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
    """Catch-all translating unexpected errors into HTTP 500 responses."""
    body = ErrorResponse(
        error="internal_error",
        message="An unexpected error occurred.",
        details=None,
    )
    return JSONResponse(status_code=500, content=body.model_dump())


def register_exception_handlers(app: FastAPI) -> None:
    """Attach every handler to the given FastAPI application."""
    app.add_exception_handler(DomainError, domain_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(
        RequestValidationError,
        validation_error_handler,  # type: ignore[arg-type]
    )
    app.add_exception_handler(Exception, unexpected_error_handler)
