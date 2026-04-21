"""API-level tests for `POST /api/v1/calculate`."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

ENDPOINT = "/api/v1/calculate"


@pytest.mark.parametrize(
    ("operation", "operands", "expected"),
    [
        ("add", [2, 3], 5.0),
        ("subtract", [10, 4], 6.0),
        ("multiply", [6, 7], 42.0),
        ("divide", [20, 4], 5.0),
    ],
)
async def test_happy_path_for_each_operation(
    client: AsyncClient,
    operation: str,
    operands: list[float],
    expected: float,
) -> None:
    response = await client.post(
        ENDPOINT,
        json={"operation": operation, "operands": operands},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["operation"] == operation
    assert body["operands"] == [float(operands[0]), float(operands[1])]
    assert body["result"] == expected


async def test_division_by_zero_returns_400(client: AsyncClient) -> None:
    response = await client.post(
        ENDPOINT,
        json={"operation": "divide", "operands": [10, 0]},
    )
    assert response.status_code == 400
    body = response.json()
    assert body["error"] == "division_by_zero"
    assert isinstance(body["message"], str) and body["message"]
    assert body["details"] is None


async def test_unknown_operation_returns_422(client: AsyncClient) -> None:
    response = await client.post(
        ENDPOINT,
        json={"operation": "power", "operands": [2, 3]},
    )
    assert response.status_code == 422
    body = response.json()
    assert body["error"] == "validation_error"
    assert body["details"] is not None
    assert "errors" in body["details"]


async def test_non_numeric_operand_returns_422(client: AsyncClient) -> None:
    response = await client.post(
        ENDPOINT,
        json={"operation": "add", "operands": ["abc", 3]},
    )
    assert response.status_code == 422
    body = response.json()
    assert body["error"] == "validation_error"


async def test_missing_operands_returns_422(client: AsyncClient) -> None:
    response = await client.post(ENDPOINT, json={"operation": "add"})
    assert response.status_code == 422
    body = response.json()
    assert body["error"] == "validation_error"


async def test_missing_operation_returns_422(client: AsyncClient) -> None:
    response = await client.post(ENDPOINT, json={"operands": [1, 2]})
    assert response.status_code == 422
    body = response.json()
    assert body["error"] == "validation_error"


@pytest.mark.parametrize("operands", [[1], [1, 2, 3]])
async def test_wrong_arity_returns_422(client: AsyncClient, operands: list[float]) -> None:
    response = await client.post(
        ENDPOINT,
        json={"operation": "add", "operands": operands},
    )
    assert response.status_code == 422
    body = response.json()
    assert body["error"] == "validation_error"


async def test_malformed_json_returns_422(client: AsyncClient) -> None:
    response = await client.post(
        ENDPOINT,
        content=b"{not valid json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422
    body = response.json()
    assert body["error"] == "validation_error"


async def test_cors_preflight_from_vite_origin(client: AsyncClient) -> None:
    response = await client.options(
        ENDPOINT,
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    allowed_methods = response.headers.get("access-control-allow-methods", "")
    assert "POST" in allowed_methods or "*" in allowed_methods


async def test_unexpected_error_returns_500(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Force an exception in the service to verify the catch-all handler."""
    from app.api.v1 import calculator as controller

    def boom(*_args: object, **_kwargs: object) -> float:
        raise RuntimeError("boom")

    monkeypatch.setattr(controller, "compute", boom)

    response = await client.post(
        ENDPOINT,
        json={"operation": "add", "operands": [1, 2]},
    )
    assert response.status_code == 500
    body = response.json()
    assert body["error"] == "internal_error"
    assert body["message"] == "An unexpected error occurred."
    assert body["details"] is None
