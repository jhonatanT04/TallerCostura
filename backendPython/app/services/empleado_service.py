from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Role, Usuario
from app.schemas.empleado import (
    ActualizarPagoEmpleadoRequest,
    CambiarPasswordRequest,
    CrearEmpleadoRequest,
    EmpleadoResponse,
)
from app.security.passwords import hash_password


def crear(db: Session, request: CrearEmpleadoRequest) -> EmpleadoResponse:
    if db.scalar(select(Usuario.id).where(Usuario.username == request.username)):
        raise HTTPException(status.HTTP_409_CONFLICT, "El username ya está en uso")

    usuario = Usuario(
        username=request.username,
        password=hash_password(request.password),
        nombre_completo=request.nombre_completo,
        role=Role.EMPLEADO,
        activo=True,  # creado por un ADMIN: puede entrar de inmediato
        pago_por_blusa=request.pago_por_blusa if request.pago_por_blusa is not None else Decimal("0"),
        eliminado=False,
    )
    db.add(usuario)
    db.commit()
    return EmpleadoResponse.de(usuario)


def listar(db: Session) -> list[EmpleadoResponse]:
    # Incluye los pendientes de activación (activo=false), no los eliminados.
    usuarios = db.scalars(
        select(Usuario)
        .where(Usuario.role == Role.EMPLEADO, Usuario.eliminado.is_(False))
        .order_by(Usuario.id)
    )
    return [EmpleadoResponse.de(u) for u in usuarios]


def activar(db: Session, id: int) -> EmpleadoResponse:
    usuario = _buscar_empleado_vigente(db, id)
    usuario.activo = True
    db.commit()
    return EmpleadoResponse.de(usuario)


def actualizar_pago(db: Session, id: int, request: ActualizarPagoEmpleadoRequest) -> EmpleadoResponse:
    usuario = _buscar_empleado_vigente(db, id)
    usuario.pago_por_blusa = request.pago_por_blusa
    db.commit()
    return EmpleadoResponse.de(usuario)


def cambiar_password(db: Session, id: int, request: CambiarPasswordRequest) -> None:
    # Sirve para cualquier usuario no eliminado, ADMIN incluido.
    usuario = db.get(Usuario, id)
    if usuario is None or usuario.eliminado:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    usuario.password = hash_password(request.password)
    db.commit()


def eliminar(db: Session, id: int) -> None:
    # Soft delete: se conserva el historial de registros y pagos. Nunca se elimina un ADMIN.
    usuario = _buscar_empleado_vigente(db, id)
    usuario.eliminado = True
    db.commit()


def _buscar_empleado_vigente(db: Session, id: int) -> Usuario:
    usuario = db.get(Usuario, id)
    if usuario is None or usuario.role != Role.EMPLEADO or usuario.eliminado:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empleado no encontrado")
    return usuario
