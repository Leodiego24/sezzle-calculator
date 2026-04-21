# Sezzle Calculator - Frontend

A small single-page calculator UI that consumes the Sezzle Calculator backend
for all arithmetic.

## Tech stack

- Vite 5 + React 18 + TypeScript
- CSS Modules for styling (no UI framework)
- `useReducer` wrapped in a custom `useCalculator` hook for state
- Vitest + Testing Library for unit/integration tests
- Docker (multi-stage build served by nginx)

## Getting started

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## Environment

Configuration lives in environment variables read by Vite at build time.

| Variable       | Default                 | Description                         |
| -------------- | ----------------------- | ----------------------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the calculator backend. |

Copy `.env.example` to `.env` and tweak as needed.

## Backend contract

This app calls a single endpoint: `POST /api/v1/calculate`.

Request body:

```json
{ "operation": "add", "operands": [2, 3] }
```

Success (200):

```json
{ "operation": "add", "operands": [2, 3], "result": 5 }
```

Error (400 / 422 / 500):

```json
{ "error": "division_by_zero", "message": "...", "details": null }
```

Error responses surface in the UI through a dedicated status line under the
display value. Network failures show a generic retry-friendly message.

## Testing

```bash
# Watch mode
npm test

# One-off run
npm run test:run

# With coverage (thresholds enforced in vite.config.ts)
npm run test:coverage
```

Coverage thresholds: 85% lines/statements/functions, 80% branches.

## Architecture

```
src/
  api/           # fetch wrapper and the calculate() helper
  components/    # Calculator container, Display, Keypad (CSS Modules each)
  hooks/         # useCalculator - reducer + API orchestration
  types/         # Shared types mirroring the backend schema
  utils/         # Small pure helpers (number formatting, operator symbols)
```

- **State lives in `useCalculator`**. It owns the reducer and the async
  `pressEquals` that calls the backend. Components are otherwise stateless
  and receive state + action callbacks from the `Calculator` container.
- **`Display`** is purely presentational: shows the current value, the
  in-progress expression, a loading indicator, or an error message.
- **`Keypad`** renders a static list of keys in a 4x5 CSS grid. The `0` key
  spans two columns.
- **Errors from the backend** are propagated via `ApiError` carrying the
  parsed payload. The hook forwards the human-readable `message` field.

## Docker

The repo contains a multi-stage `Dockerfile` that builds the static site with
Node 20 and serves it via `nginx:alpine`. The `VITE_API_URL` build arg is
baked into the bundle at build time.

```bash
docker build --build-arg VITE_API_URL=http://backend:8000 -t sezzle-calc-front .
docker run --rm -p 8080:80 sezzle-calc-front
```

The top-level `docker-compose.yml` (one directory up) wires the frontend to
the backend service.
