from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Role, Usuario
from app.security.jwt_service import extract_username

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> Usuario:
    """Equivalente a JwtAuthenticationFilter."""
    no_autenticado = HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    if credentials is None:
        raise no_autenticado
    try:
        username = extract_username(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "El token ha expirado")
    except jwt.InvalidTokenError:
        raise no_autenticado

    usuario = db.scalar(select(Usuario).where(Usuario.username == username))
    # Un usuario eliminado/inactivo pierde el acceso aunque su token siga vigente.
    if usuario is None or not usuario.habilitado:
        raise no_autenticado
    return usuario


CurrentUser = Annotated[Usuario, Depends(get_current_user)]


def require_role(*roles: Role):
    def checker(usuario: CurrentUser) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Acceso denegado")
        return usuario

    return checker


AdminUser = Annotated[Usuario, Depends(require_role(Role.ADMIN))]
EmpleadoUser = Annotated[Usuario, Depends(require_role(Role.EMPLEADO))]
