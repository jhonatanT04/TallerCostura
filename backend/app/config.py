from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Mismas variables que el backend Java (ver ../backend/.env)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    db_url: str
    db_user: str = ""
    db_password: str = ""

    jwt_secret_key: str
    jwt_expiration_ms: int = 28_800_000  # 8 horas

    admin_username: str = "jefa"
    admin_password: str = "jefa1234"

    cors_origins: list[str] = [
        "http://localhost:5173",
        "https://taller-costura-gray.vercel.app",
    ]
    docs_enabled: bool = True

    @field_validator("jwt_secret_key")
    @classmethod
    def _secret_min_32_bytes(cls, v: str) -> str:
        # Igual que jjwt: HMAC-SHA requiere al menos 256 bits.
        if len(v.encode()) < 32:
            raise ValueError("JWT_SECRET_KEY debe tener al menos 32 bytes")
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
