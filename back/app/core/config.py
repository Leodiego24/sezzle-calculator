"""Application configuration via pydantic-settings."""

from __future__ import annotations

from functools import lru_cache

from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=None,
        case_sensitive=False,
        extra="ignore",
    )

    # `NoDecode` disables pydantic-settings' default JSON decoding for this
    # field so the raw environment string reaches our validator as-is.
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://localhost:80",
        ],
        description=(
            "Allowed CORS origins. When set via the CORS_ORIGINS env var the "
            "value must be a comma-separated string (e.g. 'http://a,http://b')."
        ),
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_comma_separated(cls, value: object) -> object:
        """Accept a comma-separated string from the environment."""
        if isinstance(value, str):
            # Empty string → empty list (explicitly disable CORS).
            if not value.strip():
                return []
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
