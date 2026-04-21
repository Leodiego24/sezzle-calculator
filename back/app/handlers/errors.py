from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import DivisionByZeroError, DomainError
from app.schemas.calculator import ErrorResponse


async def domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
    status_code = 400 if isinstance(exc, DivisionByZeroError) else 400
    body = ErrorResponse(error=exc.code, message=exc.message, details=None)
    return JSONResponse(status_code=status_code, content=body.model_dump())


async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    body = ErrorResponse(
        error="validation_error",
        message="Invalid request.",
        details={"errors": jsonable_encoder(exc.errors())},
    )
    return JSONResponse(status_code=422, content=body.model_dump())


async def unexpected_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
    body = ErrorResponse(
        error="internal_error",
        message="An unexpected error occurred.",
        details=None,
    )
    return JSONResponse(status_code=500, content=body.model_dump())


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, domain_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(
        RequestValidationError,
        validation_error_handler,  # type: ignore[arg-type]
    )
    app.add_exception_handler(Exception, unexpected_error_handler)
