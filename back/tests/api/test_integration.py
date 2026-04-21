from __future__ import annotations

import asyncio

import pytest
from httpx import AsyncClient

ENDPOINT = "/api/v1/calculate"


async def _post(client: AsyncClient, operation: str, operands: list[float]) -> tuple[int, dict]:
    response = await client.post(
        ENDPOINT,
        json={"operation": operation, "operands": operands},
    )
    return response.status_code, response.json()


async def test_many_concurrent_requests_preserve_per_request_results(
    client: AsyncClient,
) -> None:
    cases = [("add", [i, i + 1], float(i + i + 1)) for i in range(20)]

    results = await asyncio.gather(
        *(_post(client, op, ops) for op, ops, _ in cases),
    )

    for (op, ops, expected), (status, body) in zip(cases, results, strict=True):
        assert status == 200
        assert body["operation"] == op
        assert body["operands"] == [float(ops[0]), float(ops[1])]
        assert body["result"] == expected


async def test_concurrent_mixed_operations_return_independent_results(
    client: AsyncClient,
) -> None:
    cases = [
        ("add", [2, 3], 5.0),
        ("subtract", [10, 4], 6.0),
        ("multiply", [6, 7], 42.0),
        ("divide", [20, 4], 5.0),
        ("power", [2, 10], 1024.0),
        ("sqrt", [9], 3.0),
        ("percentage", [200, 10], 20.0),
    ]

    results = await asyncio.gather(*(_post(client, op, ops) for op, ops, _ in cases))

    for (op, _, expected), (status, body) in zip(cases, results, strict=True):
        assert status == 200, f"{op} failed: {body}"
        assert body["operation"] == op
        assert body["result"] == expected


async def test_concurrent_mix_of_success_and_error_are_handled_independently(
    client: AsyncClient,
) -> None:
    ok_task = _post(client, "add", [1, 2])
    err_task = _post(client, "divide", [1, 0])

    (ok_status, ok_body), (err_status, err_body) = await asyncio.gather(ok_task, err_task)

    assert ok_status == 200
    assert ok_body["result"] == 3.0

    assert err_status == 400
    assert err_body["error"] == "division_by_zero"


async def test_chain_sequence_matches_frontend_flow(client: AsyncClient) -> None:
    status1, first = await _post(client, "add", [2, 2])
    assert status1 == 200
    intermediate = first["result"]
    assert intermediate == 4.0

    status2, final = await _post(client, "add", [intermediate, 2])
    assert status2 == 200
    assert final["result"] == 6.0


@pytest.mark.parametrize(
    ("steps", "expected_final"),
    [
        ([("add", 1, 2), ("add", None, 3), ("add", None, 4)], 10.0),
        ([("subtract", 10, 3), ("multiply", None, 2), ("divide", None, 7)], 2.0),
        ([("multiply", 5, 4), ("subtract", None, 10), ("divide", None, 2)], 5.0),
    ],
)
async def test_multi_step_chains_produce_expected_final_result(
    client: AsyncClient,
    steps: list[tuple[str, float | None, float]],
    expected_final: float,
) -> None:
    current: float | None = None
    for operation, first, second in steps:
        left = first if current is None else current
        assert left is not None
        status, body = await _post(client, operation, [left, second])
        assert status == 200, f"step {operation} failed: {body}"
        current = body["result"]

    assert current == expected_final


async def test_stress_50_concurrent_varied_requests(client: AsyncClient) -> None:
    tasks = []
    expectations: list[tuple[int, str, float | None]] = []
    for i in range(50):
        if i % 7 == 0:
            tasks.append(_post(client, "divide", [i, 0]))
            expectations.append((400, "division_by_zero", None))
        else:
            tasks.append(_post(client, "add", [i, 1]))
            expectations.append((200, "add", float(i + 1)))

    results = await asyncio.gather(*tasks)

    for (expected_status, expected_marker, expected_value), (status, body) in zip(
        expectations, results, strict=True
    ):
        assert status == expected_status
        if expected_status == 200:
            assert body["operation"] == expected_marker
            assert body["result"] == expected_value
        else:
            assert body["error"] == expected_marker
