from fastapi import APIRouter, Depends, status

from app.database import DB
from app.models import Role
from app.schemas.orden import CrearOrdenRequest, OrdenDTO
from app.security.deps import require_role
from app.services import orden_service

router = APIRouter(
    prefix="/api/ordenes",
    tags=["ordenes"],
    dependencies=[Depends(require_role(Role.ADMIN))],
)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=OrdenDTO)
def crear(request: CrearOrdenRequest, db: DB):
    return orden_service.crear(db, request)


@router.get("", response_model=list[OrdenDTO])
def listar(db: DB):
    return orden_service.listar(db)


@router.get("/{id}", response_model=OrdenDTO)
def obtener(id: int, db: DB):
    return orden_service.obtener(db, id)


@router.get("/cliente/{clienteId}", response_model=list[OrdenDTO])
def ordenes_por_cliente(clienteId: int, db: DB):
    return orden_service.ordenes_por_cliente(db, clienteId)
