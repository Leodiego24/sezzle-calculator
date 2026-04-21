"""Pure-domain calculator service.

Adding a new operation requires touching only this file and the
`Operation` enum in `app.schemas.calculator`.
"""

from __future__ import annotations

from collections.abc import Callable

from app.core.exceptions import DivisionByZeroError
from app.schemas.calculator import Operation


def _divide(a: float, b: float) -> float:
    """Divide `a` by `b`, raising a domain error on zero divisor."""
    if b == 0:
        raise DivisionByZeroError()
    return a / b


_DISPATCH: dict[Operation, Callable[[float, float], float]] = {
    Operation.ADD: lambda a, b: a + b,
    Operation.SUBTRACT: lambda a, b: a - b,
    Operation.MULTIPLY: lambda a, b: a * b,
    Operation.DIVIDE: _divide,
}


def compute(operation: Operation, operands: list[float]) -> float:
    """Apply `operation` to the two operands and return the result.

    Arity validation is the responsibility of the request schema; this
    function assumes exactly two operands and will raise `TypeError`
    from the underlying lambda if that invariant is broken.
    """
    return _DISPATCH[operation](*operands)
