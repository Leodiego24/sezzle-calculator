from __future__ import annotations

import math
from collections.abc import Callable

from app.core.exceptions import DivisionByZeroError, InvalidOperandError
from app.schemas.calculator import OPERATION_ARITY, Operation


def _divide(a: float, b: float) -> float:
    if b == 0:
        raise DivisionByZeroError()
    return a / b


def _power(base: float, exponent: float) -> float:
    if base == 0 and exponent < 0:
        raise InvalidOperandError("Cannot raise zero to a negative power.")
    if base < 0 and not exponent.is_integer():
        raise InvalidOperandError(
            "Cannot raise a negative number to a fractional power."
        )
    try:
        return base**exponent
    except OverflowError as exc:
        raise InvalidOperandError("Result is too large to represent.") from exc


def _sqrt(x: float) -> float:
    if x < 0:
        raise InvalidOperandError("Cannot take the square root of a negative number.")
    return math.sqrt(x)


def _percentage(x: float, y: float) -> float:
    return x * y / 100

_DISPATCH: dict[Operation, Callable[..., float]] = {
    Operation.ADD: lambda a, b: a + b,
    Operation.SUBTRACT: lambda a, b: a - b,
    Operation.MULTIPLY: lambda a, b: a * b,
    Operation.DIVIDE: _divide,
    Operation.POWER: _power,
    Operation.SQRT: _sqrt,
    Operation.PERCENTAGE: _percentage,
}

assert set(_DISPATCH) == set(OPERATION_ARITY) == set(Operation), (
    "Dispatch table and arity map must cover every Operation enum value."
)


def compute(operation: Operation, operands: list[float]) -> float:
    return _DISPATCH[operation](*operands)
