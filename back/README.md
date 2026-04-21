# Sezzle Calculator — Backend

Minimal FastAPI service exposing a single endpoint that performs one of four
arithmetic operations on two operands.

## Stack

- Python 3.13
- FastAPI + Pydantic v2 + pydantic-settings
- uvicorn (ASGI server)
- uv (dependency management)
- pytest + pytest-asyncio + pytest-cov + httpx (tests)
- ruff + mypy (lint / type-check)

## Running locally

```bash
# From back/
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive Swagger UI
is served at [`/docs`](http://localhost:8000/docs) and the OpenAPI schema at
`/openapi.json`.

### Configuration

| Env var         | Default                                              | Description                                  |
|-----------------|------------------------------------------------------|----------------------------------------------|
| `CORS_ORIGINS`  | `http://localhost:5173,http://localhost:80`          | Comma-separated list of allowed CORS origins |

## Running tests

```bash
uv run pytest
```

Coverage is enforced at 90% (configured in `pyproject.toml`).

## API

### `POST /api/v1/calculate`

Request body:

```json
{
  "operation": "add" | "subtract" | "multiply" | "divide",
  "operands": [number, number]
}
```

Success response (HTTP 200):

```json
{ "operation": "add", "operands": [2.0, 3.0], "result": 5.0 }
```

Error response (HTTP 4xx/5xx):

```json
{
  "error": "division_by_zero" | "validation_error" | "internal_error",
  "message": "Human-readable explanation.",
  "details": { "...": "..." } | null
}
```

HTTP status codes:

| Code | `error`             | When                                                                                     |
|------|---------------------|------------------------------------------------------------------------------------------|
| 200  | —                   | Operation succeeded.                                                                     |
| 400  | `division_by_zero`  | Division with a zero divisor.                                                            |
| 422  | `validation_error`  | Unknown operation, non-numeric operand, missing field, wrong arity, or malformed JSON.   |
| 500  | `internal_error`    | Unexpected server error.                                                                 |

### Examples

Successful addition:

```bash
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"add","operands":[2,3]}'
# {"operation":"add","operands":[2.0,3.0],"result":5.0}
```

Division by zero (400):

```bash
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"divide","operands":[10,0]}'
# {"error":"division_by_zero","message":"Division by zero is not allowed.","details":null}
```

Unknown operation (422):

```bash
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"power","operands":[2,3]}'
# {"error":"validation_error","message":"Invalid request.","details":{"errors":[...]}}
```

Malformed JSON (422):

```bash
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{not valid json'
# {"error":"validation_error","message":"Invalid request.","details":{"errors":[...]}}
```

## Notes on numeric precision

This implementation uses native Python `float` (IEEE-754 double precision).
Classic floating-point oddities such as `0.1 + 0.2 == 0.30000000000000004`
therefore appear in responses. A `Decimal`-based implementation would avoid
this but was explicitly out of scope.

## Project layout

```
app/
  api/v1/        # HTTP controllers (thin)
  core/          # Config + domain exceptions
  handlers/      # FastAPI exception handlers
  schemas/       # Pydantic request/response models
  services/      # Pure domain logic (dispatch table)
  main.py        # create_app() factory
tests/
  unit/          # Service-level unit tests
  api/           # HTTP-level tests via httpx.AsyncClient + ASGITransport
```
