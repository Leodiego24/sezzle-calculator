"""Shared pytest fixtures."""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """Yield an `httpx.AsyncClient` backed by a fresh ASGI application."""
    app = create_app()
    # `raise_app_exceptions=False` lets FastAPI's own exception handlers
    # run for unhandled exceptions, so tests can observe the 500 response
    # body shaped by our catch-all handler instead of having httpx re-raise.
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http_client:
        yield http_client
