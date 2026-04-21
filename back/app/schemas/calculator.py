from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Operation(str, Enum):
    ADD = "add"
    SUBTRACT = "subtract"
    MULTIPLY = "multiply"
    DIVIDE = "divide"
    POWER = "power"
    SQRT = "sqrt"
    PERCENTAGE = "percentage"

OPERATION_ARITY: dict[Operation, int] = {
    Operation.ADD: 2,
    Operation.SUBTRACT: 2,
    Operation.MULTIPLY: 2,
    Operation.DIVIDE: 2,
    Operation.POWER: 2,
    Operation.SQRT: 1,
    Operation.PERCENTAGE: 2,
}


class CalculateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation: Operation = Field(
        ...,
        description="Operation to apply to the operands.",
    )
    operands: list[float] = Field(
        ...,
        min_length=1,
        max_length=2,
        description="One or two numeric operands (arity depends on operation).",
    )

    @model_validator(mode="after")
    def _check_arity(self) -> "CalculateRequest":
        expected = OPERATION_ARITY[self.operation]
        if len(self.operands) != expected:
            raise ValueError(
                f"Operation '{self.operation.value}' requires exactly "
                f"{expected} operand{'s' if expected != 1 else ''}, "
                f"got {len(self.operands)}."
            )
        return self


class CalculateResponse(BaseModel):
    operation: Operation
    operands: list[float]
    result: float


class ErrorResponse(BaseModel):
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
