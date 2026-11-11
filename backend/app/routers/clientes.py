from fastapi import APIRouter, Depends, status

from app.database import DB
from app.models import Role
from app.schemas.orden import ClienteResponse, CrearClienteRequest
from app.security.deps import require_role
from app.services import cliente_service

router = APIRouter(
    prefix="/api/clientes",
    tags=["clientes"],
    dependencies=[Depends(require_role(Role.ADMIN))],
)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ClienteResponse)
def crear(request: CrearClienteRequest, db: DB):
    return cliente_service.crear(db, request)


@router.get("", response_model=list[ClienteResponse])
def listar(db: DB):
    return cliente_service.listar(db)
