"""Request and response schemas for the calculator endpoint."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Operation(str, Enum):
    """Supported arithmetic operations."""

    ADD = "add"
    SUBTRACT = "subtract"
    MULTIPLY = "multiply"
    DIVIDE = "divide"


class CalculateRequest(BaseModel):
    """Incoming payload for the `/calculate` endpoint."""

    model_config = ConfigDict(extra="forbid")

    operation: Operation = Field(
        ...,
        description="Operation to apply to the operands.",
    )
    operands: list[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Exactly two numeric operands (left, right).",
    )


class CalculateResponse(BaseModel):
    """Successful response echoing the request plus the computed result."""

    operation: Operation
    operands: list[float]
    result: float


class ErrorResponse(BaseModel):
    """Uniform error body returned by every non-2xx response."""

    error: str = Field(
        ...,
        description="Machine-readable error code (e.g. 'division_by_zero').",
    )
    message: str = Field(
        ...,
        description="Human-readable explanation of the error.",
    )
    details: dict[str, Any] | None = Field(
        default=None,
        description="Optional structured context for the error.",
    )
