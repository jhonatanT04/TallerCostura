from fastapi import APIRouter, Depends, Response, status

from app.database import DB
from app.models import Role
from app.schemas.empleado import (
    ActualizarPagoEmpleadoRequest,
    CambiarPasswordRequest,
    CrearEmpleadoRequest,
    EmpleadoResponse,
)
from app.schemas.registro import RegistroDTO
from app.security.deps import require_role
from app.services import empleado_service, registro_service

router = APIRouter(
    prefix="/api/empleados",
    tags=["empleados"],
    dependencies=[Depends(require_role(Role.ADMIN))],
)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=EmpleadoResponse)
def crear(request: CrearEmpleadoRequest, db: DB):
    return empleado_service.crear(db, request)


@router.get("", response_model=list[EmpleadoResponse])
def listar(db: DB):
    return empleado_service.listar(db)


@router.get("/{id}/registros", response_model=list[RegistroDTO])
def registros_de_empleado(id: int, db: DB):
    return registro_service.registros_por_empleado(db, id)


@router.patch("/{id}/activar", response_model=EmpleadoResponse)
def activar(id: int, db: DB):
    return empleado_service.activar(db, id)


@router.patch("/{id}/pago", response_model=EmpleadoResponse)
def actualizar_pago(id: int, request: ActualizarPagoEmpleadoRequest, db: DB):
    return empleado_service.actualizar_pago(db, id, request)


@router.patch("/{id}/password", status_code=status.HTTP_204_NO_CONTENT)
def cambiar_password(id: int, request: CambiarPasswordRequest, db: DB) -> Response:
    empleado_service.cambiar_password(db, id, request)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id: int, db: DB) -> Response:
    empleado_service.eliminar(db, id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
