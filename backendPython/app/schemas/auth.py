from app.models import Role
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
