import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file if present
load_dotenv()

DEFAULT_DATABASE_URL = (
    "sqlite+aiosqlite:////tmp/food_finder.db"
    if os.getenv("VERCEL")
    else "sqlite+aiosqlite:///./food_finder.db"
)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Restaurant Finder - Tamil Nadu Edition"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tn-smart-restaurant-finder-secret-key-2026-super-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database: Supports PostgreSQL URI via env (e.g. postgresql+asyncpg://user:pass@localhost/dbname)
    # Defaults to local SQLite async database for zero-config instant startup
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    
    # SMTP / Email Simulation settings
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.example.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", os.getenv("SMTP_USER", "reservations@smartrestaurantfinder.in"))

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()

