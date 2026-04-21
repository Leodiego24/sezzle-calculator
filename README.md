# Sezzle Calculator

A full-stack calculator delivered as a **Python + FastAPI** backend consumed by a **React + TypeScript** frontend. Clean separation of concerns, explicit typed contracts, and a codebase where adding a new operation touches one or two files.

---

## Architecture

```
  ┌─────────────────────┐       POST /api/v1/calculate       ┌──────────────────────┐
  │  React + TS + Vite  │ ─────────────────────────────────▶ │  FastAPI (Python)    │
  │  useCalculator hook │                                    │  Router → Service    │
  │  CSS Modules UI     │ ◀──────────────────────────────── │  Dispatch table      │
  └─────────────────────┘         JSON result / error        └──────────────────────┘
```

- Single endpoint, operation-dispatched — new operations are additive.
- Typed contract end-to-end: Pydantic on the server, TypeScript on the client, same JSON on the wire.
- All non-2xx responses share one `{ error, message, details }` envelope so the frontend has a single error branch.

---

## Repository layout

```
sezzle-calculator/
├── back/               # FastAPI service (Python 3.13, uv-managed)
│   ├── app/
│   │   ├── api/v1/     # HTTP controllers (thin)
│   │   ├── core/       # Config + domain exceptions
│   │   ├── handlers/   # FastAPI exception handlers
│   │   ├── schemas/    # Pydantic request/response models + Operation enum
│   │   ├── services/   # Pure domain logic (dispatch table)
│   │   └── main.py     # create_app() factory
│   ├── tests/
│   │   ├── unit/       # Service-level unit tests
│   │   └── api/        # HTTP-level tests (httpx.AsyncClient + ASGITransport) + integration
│   ├── pyproject.toml
│   └── Dockerfile
├── front/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/        # fetch wrapper + typed calculator client
│   │   ├── components/ # Calculator container, Display, Keypad (CSS Modules each)
│   │   ├── hooks/      # useCalculator — reducer + API orchestration
│   │   ├── types/      # Shared types mirroring the backend schema
│   │   └── utils/      # Number formatting, operator symbols
│   ├── tests/          # Vitest + React Testing Library
│   ├── package.json
│   └── Dockerfile      # Multi-stage: Node build → nginx:alpine
├── docker-compose.yml  # One-command local stack
├── .gitignore
├── .editorconfig
└── README.md
```

---

## Quick start

### Option A — Docker Compose (recommended)

Requires Docker 24+ / Compose v2.

```bash
docker compose up --build
```

- Backend: <http://localhost:8000> (Swagger UI at `/docs`)
- Frontend: <http://localhost:8080>

Stop with `Ctrl+C` (or `docker compose down` in another shell).

### Option B — Run services locally

Two terminals.

**Backend** (Python 3.13, [uv](https://docs.astral.sh/uv/)):

```bash
cd back
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend** (Node 20+):

```bash
cd front
npm install
npm run dev            # http://localhost:5173
npm run build          # production build
npm run preview        # preview the production build
```

### Environment variables

| Variable        | Scope    | Default                                     | Description                                 |
|-----------------|----------|---------------------------------------------|---------------------------------------------|
| `CORS_ORIGINS`  | backend  | `http://localhost:5173,http://localhost:80` | Comma-separated list of allowed origins.    |
| `VITE_API_URL`  | frontend | `http://localhost:8000`                     | Base URL of the backend (baked at build).   |

Copy `front/.env.example` to `front/.env` to override the frontend default.

---

## API

Single endpoint: `POST /api/v1/calculate`.

Request body:

```json
{
  "operation": "add" | "subtract" | "multiply" | "divide" | "power" | "sqrt" | "percentage",
  "operands": [number]           // sqrt takes one operand
         // | [number, number]   // everything else takes two
}
```

Success (HTTP 200):

```json
{ "operation": "add", "operands": [2.0, 3.0], "result": 5.0 }
```

Supported operations:

| Operation    | Arity | Semantics                                                     |
|--------------|-------|---------------------------------------------------------------|
| `add`        | 2     | `a + b`                                                       |
| `subtract`   | 2     | `a - b`                                                       |
| `multiply`   | 2     | `a * b`                                                       |
| `divide`     | 2     | `a / b`; `b == 0` → `division_by_zero`                        |
| `power`      | 2     | `base ^ exponent`; strict edge cases → `invalid_operand`      |
| `sqrt`       | 1     | `√x`; negative `x` → `invalid_operand`                        |
| `percentage` | 2     | `x * y / 100` — "y percent of x" (e.g. `[200, 10] → 20`)      |

### Error envelope

Every non-2xx response has this shape:

```json
{ "error": "<machine_code>", "message": "<human text>", "details": { ... } | null }
```

| HTTP | `error`             | When                                                                                                    |
|------|---------------------|---------------------------------------------------------------------------------------------------------|
| 200  | —                   | Operation succeeded                                                                                     |
| 400  | `division_by_zero`  | Division with divisor `0`                                                                               |
| 400  | `invalid_operand`   | `sqrt` of a negative, `0^(-x)`, negative base with fractional exponent, or power result overflow        |
| 422  | `validation_error`  | Unknown operation, non-numeric operand, missing field, wrong arity (e.g. sqrt with 2 operands), or malformed JSON |
| 500  | `internal_error`    | Unexpected server error                                                                                 |

### Examples

```bash
# Addition (200)
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"add","operands":[2,3]}'
# → {"operation":"add","operands":[2.0,3.0],"result":5.0}

# Square root (200 — arity 1)
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"sqrt","operands":[9]}'
# → {"operation":"sqrt","operands":[9.0],"result":3.0}

# Percentage (200) — y% of x
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"percentage","operands":[200,10]}'
# → {"operation":"percentage","operands":[200.0,10.0],"result":20.0}

# Division by zero (400)
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"divide","operands":[10,0]}'
# → {"error":"division_by_zero","message":"Division by zero is not allowed.","details":null}

# Square root of negative (400)
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"sqrt","operands":[-1]}'
# → {"error":"invalid_operand","message":"Cannot take the square root of a negative number.","details":null}

# Power overflow (400)
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"power","operands":[10,1000]}'
# → {"error":"invalid_operand","message":"Result is too large to represent.","details":null}

# Wrong arity (422)
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"sqrt","operands":[4,9]}'
# → {"error":"validation_error",...}

# Unknown operation (422)
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"modulo","operands":[2,3]}'
# → {"error":"validation_error",...}
```

The full API reference lives in the interactive Swagger UI at `/docs`.

---

## Testing

Both layers enforce coverage thresholds.

```bash
# Backend — enforced ≥90%
cd back && uv run pytest

# Frontend
cd front
npm test                # watch mode
npm run test:run        # one-off run
npm run test:coverage   # enforced 85% lines/statements/functions, 80% branches
```

Test organization:

- **Backend `tests/unit/`** — pure service-layer tests (no HTTP) covering every operation and edge case.
- **Backend `tests/api/test_calculate_endpoint.py`** — HTTP-level happy paths, arity errors, domain errors, validation errors, CORS, and the 500 catch-all.
- **Backend `tests/api/test_integration.py`** — concurrent and multi-step scenarios (`asyncio.gather`, chained sequences) validating statelessness and async safety.
- **Frontend `tests/`** — component, hook, and API-client tests under Vitest + React Testing Library.

At the time of delivery: backend 100% coverage (70 tests), frontend 95%+ coverage (51 tests).

---

## Design decisions

### Python + FastAPI over Go
The brief suggested Go; this project is Python + FastAPI. The architecture (layered, typed, versioned, single endpoint) is language-agnostic and would translate 1:1 to Go. Python was chosen for faster iteration within the challenge window, first-class Pydantic validation, and FastAPI's automatic OpenAPI generation — a reviewer gets a live Swagger UI at `/docs` for free.

### Single `/calculate` endpoint (vs. one per operation)
Calculation is an RPC-style compute call, not a REST resource. A single dispatched endpoint means:
- Adding an operation touches 2 files: the `Operation` enum (plus its arity map) and the dispatch table. No new route, no new controller.
- The frontend has one typed client function, not seven.
- API versioning is centralized: an eventual `v2` moves one endpoint, not N.

### Layered architecture (routes → schemas → services → handlers)
- `services/` is pure domain logic; it knows nothing about HTTP.
- `handlers/` owns translation of domain/validation errors to the `ErrorResponse` envelope.
- This makes future additions (persistence, auth) purely additive.

### Native `float`, not `Decimal`
Simplicity won. Documented trade-off: `0.1 + 0.2 == 0.30000000000000004`. Decimal would avoid it but requires end-to-end string serialization — not worth the scope on a demo calculator.

### uv for Python dependency management
`uv` is 10–100× faster than pip/poetry, lockfile-native, PEP 621 compliant. One tool for venv, install, lock, and run.

### Vite + React 18 + TypeScript
CRA is deprecated (March 2023). Vite is the current standard: instant dev server, native HMR, zero-config TypeScript. No Next.js because this app needs nothing Next offers.

### `useReducer` inside a `useCalculator` hook (no Redux/Zustand)
The calculator is a finite state machine (idle → entering → computing → result | error). A reducer makes state transitions explicit and trivially testable without a global store.

### CSS Modules over Tailwind
For one screen of UI, Tailwind is a dependency, a config file, and a toolchain tax. CSS Modules are zero-config in Vite, give scoped class names, and keep the deliverable minimal.

### Uniform error envelope
Every non-2xx response — domain error, validation error, unexpected crash — returns `{ error, message, details }`. Frontend has one error branch, tested once.

### Arity-per-operation encoded in the schema
`OPERATION_ARITY` in `back/app/schemas/calculator.py` is the single source of truth for how many operands each operation takes. A Pydantic `model_validator` checks it, so wrong-arity requests surface as standard `422 validation_error` without any bespoke handling.
