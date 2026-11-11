from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import RegistroBlusa, Usuario
from app.schemas.registro import RegistroDTO


def registros_por_empleado(db: Session, empleado_id: int) -> list[RegistroDTO]:
    if db.get(Usuario, empleado_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empleado no encontrado")

    registros = db.scalars(
        select(RegistroBlusa)
        .options(joinedload(RegistroBlusa.usuario))
        .where(RegistroBlusa.usuario_id == empleado_id)
        .order_by(RegistroBlusa.fecha_registro.desc())
    )
    return [RegistroDTO.de(r) for r in registros]
