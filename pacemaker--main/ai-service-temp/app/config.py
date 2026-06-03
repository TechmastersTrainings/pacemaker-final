"""
Application configuration via pydantic-settings.
Reads values from environment variables / .env file.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Groq
    groq_api_key: str
    groq_model: str = "llama-3.1-70b-versatile"
    groq_max_tokens: int = 2048
    groq_temperature: float = 0.7

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_cache_ttl: int = 900  # 15 minutes

    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached settings instance (singleton)."""
    return Settings()
