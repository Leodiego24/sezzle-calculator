from __future__ import annotations


class DomainError(Exception):
    code: str = "domain_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class DivisionByZeroError(DomainError):
    code = "division_by_zero"

    def __init__(self, message: str = "Division by zero is not allowed.") -> None:
        super().__init__(message)


class InvalidOperandError(DomainError):
    code = "invalid_operand"

    def __init__(self, message: str = "Invalid operand for this operation.") -> None:
        super().__init__(message)
