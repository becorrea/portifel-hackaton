from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # Gemini
    GEMINI_API_KEY: str

    # Market Data
    BRAPI_TOKEN: str
    MARKET_POLL_INTERVAL_HOURS: int = 24

    # API
    API_HOST: str = "localhost"
    API_PORT: int = 8000
    DEBUG: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
