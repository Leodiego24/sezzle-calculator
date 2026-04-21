# Sezzle Calculator

A full-stack calculator delivered as a **Python + FastAPI** backend consumed by a **React + TypeScript** frontend. The emphasis is on clean separation of concerns, explicit contracts, and a codebase where adding new behavior touches one or two files.

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
- Typed contract end-to-end: Pydantic on the server, TypeScript on the client, same shape on the wire.
- Errors travel as a uniform JSON envelope so the frontend has exactly one branch.

---

## Repository layout

```
sezzle-calculator/
├── back/               # FastAPI service (see back/README.md)
├── front/              # React app (see front/README.md)
├── docker-compose.yml  # One-command local stack
├── .gitignore
├── .editorconfig
└── README.md           # You are here
```

Each service has its own README with deeper setup, testing, and architectural notes.

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
npm run dev   # http://localhost:5173
```

The frontend points at `http://localhost:8000` by default; override with `VITE_API_URL` in `front/.env` if needed.

---

## API usage

Single endpoint: `POST /api/v1/calculate`.

```bash
# Success
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"add","operands":[2,3]}'
# → {"operation":"add","operands":[2.0,3.0],"result":5.0}

# Division by zero → 400
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"divide","operands":[10,0]}'
# → {"error":"division_by_zero","message":"Division by zero is not allowed.","details":null}

# Unknown operation → 422
curl -X POST http://localhost:8000/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"power","operands":[2,3]}'
# → {"error":"validation_error","message":"Invalid request.","details":{"errors":[...]}}
```

All non-2xx responses share the same envelope:

```json
{ "error": "<machine_code>", "message": "<human text>", "details": { ... } | null }
```

| HTTP | `error`              | When                                                                                   |
|------|----------------------|----------------------------------------------------------------------------------------|
| 200  | —                    | Operation succeeded                                                                    |
| 400  | `division_by_zero`   | Division with divisor `0`                                                              |
| 422  | `validation_error`   | Unknown operation, non-numeric operand, missing field, wrong arity, or malformed JSON  |
| 500  | `internal_error`     | Unexpected server error                                                                |

Full API reference lives in the interactive Swagger UI at `/docs`.

---

## Testing

Both layers enforce coverage thresholds.

```bash
# Backend — enforced ≥90%
cd back && uv run pytest

# Frontend — enforced 85% lines/statements/functions, 80% branches
cd front && npm run test:coverage
```

At the time of delivery: backend 100% coverage (34 tests), frontend 97.53% coverage (43 tests).

---

## Design decisions

### Python + FastAPI over Go
The brief suggested Go; I delivered in Python + FastAPI. The architecture chosen here (layered, typed, versioned, single endpoint) is language-agnostic and would translate 1:1 to a Go codebase. I picked Python for: faster iteration on the domain logic within the challenge window, first-class Pydantic validation for a JSON API, and FastAPI's automatic OpenAPI generation — a reviewer gets a live Swagger UI at `/docs` for free.

### Single `/calculate` endpoint (vs. one per operation)
Calculation is an RPC-style compute call, not a REST resource. A single dispatched endpoint means:
- Adding an operation touches 2 files: the `Operation` enum and the dispatch table. No new route, no new controller, no new tests scaffold.
- The frontend has one typed client function, not seven.
- API versioning is centralized: an eventual `v2` contract change moves one endpoint, not N.

### Native `float`, not `Decimal`
Simplicity won. The trade-off is documented: `0.1 + 0.2` returns `0.30000000000000004`. A `Decimal`-based implementation would avoid that but requires end-to-end string serialization to preserve precision — not worth the scope on a demo calculator. This is called out in `back/README.md`.

### uv for Python dependency management
`uv` is 10–100× faster than pip/poetry, lockfile-native, PEP 621 compliant, and the direction the Python ecosystem is moving in 2025–2026. A single tool for venv, install, lock, and run.

### Vite + React 18 + TypeScript
CRA is deprecated (March 2023). Vite is the default modern scaffold: instant dev server, native HMR, zero-config TypeScript. No Next.js because this app needs nothing Next offers.

### `useReducer` in a custom `useCalculator` hook (no Redux/Zustand)
The calculator is a finite state machine: idle → entering → computing → result | error. A reducer makes that explicit and trivially testable without the ceremony of a global store.

### CSS Modules over Tailwind
For one screen of UI, Tailwind is a dependency, a config file, and a toolchain tax. CSS Modules are zero-config in Vite, give scoped class names, and keep the deliverable minimal.

### Uniform error envelope
Every non-2xx response — domain error, validation error, or unexpected crash — returns the same `{ error, message, details }` shape. The frontend has a single error branch, tested once.

---

## Out of scope (intentional)

Signals of discipline, not omission:

- Calculation history, undo, or persistence
- Authentication / user accounts / sessions
- Databases — the service is stateless
- Chained expressions with operator precedence (two operands per request)
- Optional operations from the brief (exponentiation, square root, percentage)
- Internationalization, dark mode, keyboard shortcuts beyond native button focus
- CI pipeline — adding GitHub Actions was a stretch goal not pursued

---

## AI tooling disclosure

This project was built with Claude Code (Anthropic's CLI agent). Prompts used:

1. **Initial framing** — the full Sezzle brief pasted into the chat with the constraint: *"Build a full-stack calculator, Python + FastAPI for the backend, React + TypeScript for the frontend, separate `back/` and `front/` folders, as clean and scalable as possible."*
2. **Scope clarification** — explicit answers that shaped the plan: only the 4 basic operations; `docker-compose` full-stack; native `float` over `Decimal` for simplicity; READMEs in English.
3. **Parallel implementation** — after plan approval, two background agents were dispatched concurrently with a binding API contract: one built `back/`, the other built `front/`. Both were bounded to their folder and told not to touch each other's code. They converged on the same JSON contract without coordination.
4. **Root orchestration** — the top-level README, `docker-compose.yml`, `.gitignore`, and `.editorconfig` were written by the main agent while the two workers ran.

The conversation language was Spanish; every artifact in this repo is English by explicit request.
