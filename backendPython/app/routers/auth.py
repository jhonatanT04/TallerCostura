from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.database import DB
from app.models import Role, Usuario
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from app.security.jwt_service import generate_token
from app.security.passwords import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: DB) -> LoginResponse:
    usuario = db.scalar(select(Usuario).where(Usuario.username == request.username))
    if usuario is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Usuario no encontrado: {request.username}"
        )
    # Contraseña incorrecta, cuenta pendiente de activar o eliminada: mismo 401 genérico.
    if not usuario.habilitado or not verify_password(request.password, usuario.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")

    return LoginResponse(
        token=generate_token(usuario),
        role=usuario.role,
        username=usuario.username,
        nombre_completo=usuario.nombre_completo,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: DB) -> Response:
    existe = db.scalar(select(Usuario.id).where(Usuario.username == request.username))
    if existe is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Ya existe un usuario con el username: {request.username}",
        )

    db.add(
        Usuario(
            username=request.username,
            password=hash_password(request.password),
            nombre_completo=request.nombre_completo,
            role=Role.EMPLEADO,
            activo=False,  # queda pendiente hasta que un ADMIN lo active
        )
    )
    db.commit()
    return Response(status_code=status.HTTP_201_CREATED)
