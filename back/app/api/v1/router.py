"""Aggregator for all v1 routes."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import calculator

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(calculator.router, tags=["calculator"])
