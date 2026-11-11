from fastapi import APIRouter, Depends

from app.database import DB
from app.models import Role
from app.schemas.pago import ConfiguracionPagoDTO, ConfiguracionPagoRequest
from app.security.deps import require_role
from app.services import configuracion_pago_service

router = APIRouter(
    prefix="/api/configuracion-pago",
    tags=["configuracion-pago"],
    dependencies=[Depends(require_role(Role.ADMIN))],
)


@router.get("", response_model=ConfiguracionPagoDTO)
def obtener(db: DB):
    return configuracion_pago_service.obtener(db)


@router.put("", response_model=ConfiguracionPagoDTO)
def actualizar(request: ConfiguracionPagoRequest, db: DB):
    return configuracion_pago_service.actualizar(db, request)
