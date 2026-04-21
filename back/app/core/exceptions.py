"""Domain-level exceptions.

These exceptions are intentionally free of HTTP knowledge. Translation to
HTTP responses happens in `app.handlers.errors`.
"""

from __future__ import annotations


class DomainError(Exception):
    """Base class for expected, business-rule violations."""

    #: Machine-readable error code surfaced in the API response body.
    code: str = "domain_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class DivisionByZeroError(DomainError):
    """Raised when a division by zero is attempted."""

    code = "division_by_zero"

    def __init__(self, message: str = "Division by zero is not allowed.") -> None:
        super().__init__(message)
