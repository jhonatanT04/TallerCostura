from functools import lru_cache
from typing import Literal

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

    # Asistente del panel. Solo lo configura quien despliega (variables de entorno); la
    # ADMIN no ve ni cambia nada de esto. Sin la clave del proveedor elegido, el endpoint
    # del asistente responde 503 y el resto de la API funciona igual.
    asistente_proveedor: Literal["openai", "gemini", "anthropic"] = "openai"
    asistente_modelo: str = ""  # vacío → el modelo por defecto del proveedor
    openai_api_key: str = ""
    gemini_api_key: str = ""
    anthropic_api_key: str = ""

    # Servidor MCP (carpeta mcp_server/). Con MCP_TOKEN se publica en /mcp por HTTP para otros
    # clientes (Claude Desktop, Cursor...); sin él solo lo usa el chat, en proceso.
    mcp_token: str = ""
    # Si se define, el chat usa ese servidor MCP remoto en vez del de este proceso.
    asistente_mcp_url: str = ""
    asistente_mcp_token: str = ""

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
