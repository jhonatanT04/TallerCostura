from datetime import date

from fastapi import APIRouter, status

from app.database import DB
from app.schemas.pago import CalcularPagoRequest, OrdenPagoDTO
from app.security.deps import AdminUser, EmpleadoUser
from app.services import pago_service

router = APIRouter(prefix="/api/pagos", tags=["pagos"])


# /mios va antes que las demás rutas, igual que en SecurityConfig.
@router.get("/mios", response_model=list[OrdenPagoDTO])
def mis_pagos(usuario: EmpleadoUser, db: DB):
    return pago_service.mis_pagos(db, usuario)


@router.post("/calcular", status_code=status.HTTP_201_CREATED, response_model=OrdenPagoDTO)
def calcular(request: CalcularPagoRequest, _: AdminUser, db: DB):
    return pago_service.calcular(db, request)


@router.get("/previsualizar", response_model=OrdenPagoDTO)
def previsualizar(empleadoId: int, semanaInicio: date, _: AdminUser, db: DB):
    """Resumen previo a confirmar: calcula lo mismo que /calcular pero no guarda nada."""
    return pago_service.previsualizar(db, empleadoId, semanaInicio)


@router.get("", response_model=list[OrdenPagoDTO])
def listar(_: AdminUser, db: DB):
    return pago_service.listar(db)


@router.get("/empleado/{empleadoId}", response_model=list[OrdenPagoDTO])
def por_empleado(empleadoId: int, _: AdminUser, db: DB):
    return pago_service.por_empleado(db, empleadoId)
