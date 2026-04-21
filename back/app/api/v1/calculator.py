"""`POST /calculate` controller.

The controller is intentionally thin: validate input (Pydantic), invoke the
service, and return a response model. Errors bubble up to the registered
exception handlers.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.calculator import CalculateRequest, CalculateResponse, ErrorResponse
from app.services.calculator import compute

router = APIRouter()


@router.post(
    "/calculate",
    response_model=CalculateResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Domain error (e.g. division by zero)."},
        422: {"model": ErrorResponse, "description": "Validation error."},
        500: {"model": ErrorResponse, "description": "Unexpected internal error."},
    },
    summary="Compute an arithmetic operation between two operands.",
)
async def calculate(payload: CalculateRequest) -> CalculateResponse:
    """Execute the requested operation and echo the inputs in the response."""
    result = compute(payload.operation, payload.operands)
    return CalculateResponse(
        operation=payload.operation,
        operands=payload.operands,
        result=result,
    )
