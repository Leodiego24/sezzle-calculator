"""Unit tests for the pure `compute` service."""

from __future__ import annotations

import math

import pytest

from app.core.exceptions import DivisionByZeroError
from app.schemas.calculator import Operation
from app.services.calculator import compute


@pytest.mark.parametrize(
    ("operation", "operands", "expected"),
    [
        # Positive integers.
        (Operation.ADD, [2.0, 3.0], 5.0),
        (Operation.SUBTRACT, [5.0, 3.0], 2.0),
        (Operation.MULTIPLY, [4.0, 3.0], 12.0),
        (Operation.DIVIDE, [10.0, 2.0], 5.0),
        # Negative numbers.
        (Operation.ADD, [-2.0, -3.0], -5.0),
        (Operation.SUBTRACT, [-5.0, 3.0], -8.0),
        (Operation.MULTIPLY, [-4.0, 3.0], -12.0),
        (Operation.DIVIDE, [-10.0, 2.0], -5.0),
        # Decimals.
        (Operation.ADD, [0.5, 0.25], 0.75),
        (Operation.SUBTRACT, [1.5, 0.5], 1.0),
        (Operation.MULTIPLY, [2.5, 4.0], 10.0),
        (Operation.DIVIDE, [7.5, 2.5], 3.0),
        # Zero handling (non-division).
        (Operation.ADD, [0.0, 0.0], 0.0),
        (Operation.MULTIPLY, [0.0, 42.0], 0.0),
    ],
)
def test_compute_returns_expected_result(
    operation: Operation, operands: list[float], expected: float
) -> None:
    result = compute(operation, operands)
    assert math.isclose(result, expected, rel_tol=1e-9, abs_tol=1e-9)


def test_divide_by_zero_raises_domain_error() -> None:
    with pytest.raises(DivisionByZeroError) as exc_info:
        compute(Operation.DIVIDE, [1.0, 0.0])
    assert exc_info.value.code == "division_by_zero"
    assert "zero" in exc_info.value.message.lower()


def test_divide_by_negative_zero_also_raises() -> None:
    # In IEEE-754, -0.0 == 0.0, so this must also raise.
    with pytest.raises(DivisionByZeroError):
        compute(Operation.DIVIDE, [1.0, -0.0])
