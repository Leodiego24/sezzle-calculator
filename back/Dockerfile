# syntax=docker/dockerfile:1.7

# ---------- Stage 1: install dependencies with uv ----------
FROM python:3.13-slim AS builder

# Install uv from the official distroless image (fast, pinned).
COPY --from=ghcr.io/astral-sh/uv:0.11.7 /uv /uvx /usr/local/bin/

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy only the dependency manifest first to maximize Docker layer caching.
COPY pyproject.toml uv.lock ./
COPY app ./app
COPY README.md ./

# Install the project (and its pinned deps) into a local .venv, no dev group.
RUN uv sync --frozen --no-dev


# ---------- Stage 2: minimal runtime ----------
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:${PATH}"

WORKDIR /app

# Create a non-root user and group.
RUN groupadd --system --gid 1001 app \
    && useradd --system --uid 1001 --gid app --no-create-home app

# Copy the virtualenv and application code from the builder stage.
COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --from=builder --chown=app:app /app/app /app/app

USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
