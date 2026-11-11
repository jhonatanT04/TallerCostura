from datetime import date

from fastapi import APIRouter, status

from app.database import DB
from app.schemas.registro import CrearRegistroRequest, RegistroDTO
from app.security.deps import AdminUser, EmpleadoUser
from app.services import registro_service

router = APIRouter(prefix="/api/registros", tags=["registros"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=RegistroDTO)
def crear(request: CrearRegistroRequest, usuario: EmpleadoUser, db: DB):
    return registro_service.crear(db, usuario, request)


@router.get("/mios", response_model=list[RegistroDTO])
def mios(usuario: EmpleadoUser, db: DB):
    return registro_service.mis_registros(db, usuario)


@router.get("", response_model=list[RegistroDTO])
def todos(_: AdminUser, db: DB):
    return registro_service.todos(db)


@router.get("/getForDate", response_model=list[RegistroDTO])
def registros_por_fecha(
    _: AdminUser,
    db: DB,
    fechaInicio: date | None = None,
    fechaFin: date | None = None,
    empleadoId: int | None = None,
):
    return registro_service.registros_por_fecha(db, fechaInicio, fechaFin, empleadoId)
