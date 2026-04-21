from __future__ import annotations

from app.core.config import Settings


def test_default_cors_origins() -> None:
    settings = Settings()
    assert settings.cors_origins == [
        "http://localhost:5173",
        "http://localhost:80",
    ]


def test_cors_origins_parses_comma_separated_env(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv("CORS_ORIGINS", "http://a.test, http://b.test , http://c.test")
    settings = Settings()
    assert settings.cors_origins == [
        "http://a.test",
        "http://b.test",
        "http://c.test",
    ]


def test_cors_origins_empty_env_disables_cors(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv("CORS_ORIGINS", "   ")
    settings = Settings()
    assert settings.cors_origins == []


def test_cors_origins_passthrough_for_non_string() -> None:
    settings = Settings(cors_origins=["http://x.test"])
    assert settings.cors_origins == ["http://x.test"]
