from __future__ import annotations

import math

import pytest

from app.core.exceptions import DivisionByZeroError, InvalidOperandError
from app.schemas.calculator import OPERATION_ARITY, Operation
from app.services.calculator import _DISPATCH, compute


@pytest.mark.parametrize(
    ("operation", "operands", "expected"),
    [
        (Operation.ADD, [2.0, 3.0], 5.0),
        (Operation.SUBTRACT, [5.0, 3.0], 2.0),
        (Operation.MULTIPLY, [4.0, 3.0], 12.0),
        (Operation.DIVIDE, [10.0, 2.0], 5.0),
        (Operation.ADD, [-2.0, -3.0], -5.0),
        (Operation.SUBTRACT, [-5.0, 3.0], -8.0),
        (Operation.MULTIPLY, [-4.0, 3.0], -12.0),
        (Operation.DIVIDE, [-10.0, 2.0], -5.0),
        (Operation.ADD, [0.5, 0.25], 0.75),
        (Operation.SUBTRACT, [1.5, 0.5], 1.0),
        (Operation.MULTIPLY, [2.5, 4.0], 10.0),
        (Operation.DIVIDE, [7.5, 2.5], 3.0),
        (Operation.ADD, [0.0, 0.0], 0.0),
        (Operation.MULTIPLY, [0.0, 42.0], 0.0),
        (Operation.POWER, [2.0, 10.0], 1024.0),
        (Operation.POWER, [2.0, -1.0], 0.5),
        (Operation.POWER, [2.0, 0.5], math.sqrt(2)),
        (Operation.POWER, [-2.0, 3.0], -8.0),
        (Operation.POWER, [5.0, 0.0], 1.0),
        (Operation.SQRT, [4.0], 2.0),
        (Operation.SQRT, [0.0], 0.0),
        (Operation.SQRT, [2.0], math.sqrt(2)),
        (Operation.PERCENTAGE, [200.0, 10.0], 20.0),
        (Operation.PERCENTAGE, [50.0, 0.0], 0.0),
        (Operation.PERCENTAGE, [100.0, 200.0], 200.0),
        (Operation.PERCENTAGE, [-200.0, 10.0], -20.0),
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
    with pytest.raises(DivisionByZeroError):
        compute(Operation.DIVIDE, [1.0, -0.0])


@pytest.mark.parametrize(
    ("operands", "expected_fragment"),
    [
        ([0.0, -1.0], "zero to a negative"),
        ([-2.0, 0.5], "fractional"),
        ([10.0, 1000.0], "too large"),
    ],
)
def test_power_edge_cases_raise_invalid_operand(
    operands: list[float], expected_fragment: str
) -> None:
    with pytest.raises(InvalidOperandError) as exc_info:
        compute(Operation.POWER, operands)
    assert exc_info.value.code == "invalid_operand"
    assert expected_fragment in exc_info.value.message.lower()


def test_sqrt_negative_raises_invalid_operand() -> None:
    with pytest.raises(InvalidOperandError) as exc_info:
        compute(Operation.SQRT, [-1.0])
    assert exc_info.value.code == "invalid_operand"
    assert "negative" in exc_info.value.message.lower()


def test_every_operation_has_dispatch_and_arity() -> None:
    operations = set(Operation)
    assert set(_DISPATCH) == operations, "Dispatch table missing an operation."
    assert set(OPERATION_ARITY) == operations, "Arity map missing an operation."
