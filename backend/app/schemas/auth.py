from datetime import datetime
from typing import Annotated, Literal

from pydantic import StringConstraints

from app.models import ProveedorSocial, Role
from app.schemas.common import CamelModel, NotBlank, Password


class LoginRequest(CamelModel):
    username: NotBlank
    password: NotBlank


class LoginResponse(CamelModel):
    token: str
    role: Role
    username: str
    nombre_completo: str


class RegisterRequest(CamelModel):
    username: NotBlank
    password: Password
    nombre_completo: NotBlank


class SocialLoginRequest(CamelModel):
    proveedor: ProveedorSocial
    # Google: el ID token (credential) de Google Identity Services.
    # Facebook: el access token de FB.login().
    token: Annotated[str, StringConstraints(min_length=1, max_length=8192)]


class SocialLoginResponse(CamelModel):
    """AUTENTICADO trae la sesión (igual que /login). PENDIENTE: la cuenta existe pero la
    ADMIN todavía no la activa (incluye las que se acaban de crear con este inicio de sesión)."""

    estado: Literal["AUTENTICADO", "PENDIENTE"]
    sesion: LoginResponse | None = None
    mensaje: str | None = None


class ConfigGoogle(CamelModel):
    client_id: str


class ConfigFacebook(CamelModel):
    app_id: str
    version: str


class ProveedoresResponse(CamelModel):
    """Datos públicos para cargar los botones en el navegador; null = no configurado."""

    google: ConfigGoogle | None
    facebook: ConfigFacebook | None


class VinculoDTO(CamelModel):
    proveedor: ProveedorSocial
    email: str | None
    vinculado_en: datetime
