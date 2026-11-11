from typing import Annotated

from pydantic import AfterValidator
from pydantic_core import PydanticCustomError

from app.models import Role
from app.schemas.common import CamelModel, NotBlank


def _min_6(v: str) -> str:
    if len(v) < 6:
        raise PydanticCustomError(
            "password_size", "La contraseña debe tener al menos 6 caracteres"
        )
    return v


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
    password: Annotated[NotBlank, AfterValidator(_min_6)]
    nombre_completo: NotBlank
