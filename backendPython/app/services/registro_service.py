from datetime import UTC, date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload

from app.models import RegistroBlusa, Usuario
from app.schemas.registro import CrearRegistroRequest, RegistroDTO
from app.services.talla_catalog import TALLAS_VALIDAS


def crear(db: Session, usuario: Usuario, request: CrearRegistroRequest) -> RegistroDTO:
    if request.talla not in TALLAS_VALIDAS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Talla inválida: {request.talla}")
    # Confección, mullos y ataches son independientes y NO se validan entre sí
    # (decisión de producto: la ADMIN revisa). Solo se exige que no sean todas 0.
    if request.cantidad_confeccion == request.cantidad_mullos == request.cantidad_ataches == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Debe registrar al menos una cantidad")

    registro = RegistroBlusa(
        usuario=usuario,  # siempre el usuario autenticado, nunca uno del body
        color=request.color.strip(),
        talla=request.talla,
        cantidad_confeccion=request.cantidad_confeccion,
        cantidad_mullos=request.cantidad_mullos,
        cantidad_ataches=request.cantidad_ataches,
        fecha_registro=datetime.now(UTC),  # la asigna el servidor
    )
    db.add(registro)
    db.commit()
    return RegistroDTO.de(registro)


def mis_registros(db: Session, usuario: Usuario) -> list[RegistroDTO]:
    return _listar(db, _query().where(RegistroBlusa.usuario_id == usuario.id))


def todos(db: Session) -> list[RegistroDTO]:
    """Todas las empleadas, pero limitado a los últimos 30 días."""
    ahora = datetime.now(UTC)
    return _listar(db, _entre(_query(), ahora - timedelta(days=30), ahora))


def registros_por_empleado(db: Session, empleado_id: int) -> list[RegistroDTO]:
    _verificar_empleado(db, empleado_id)
    return _listar(db, _query().where(RegistroBlusa.usuario_id == empleado_id))


def registros_por_fecha(
    db: Session, fecha_inicio: date | None, fecha_fin: date | None, empleado_id: int | None
) -> list[RegistroDTO]:
    """Rango de fechas (por defecto, hoy) en la zona horaria del servidor, igual que
    `ZoneId.systemDefault()` en Java: se controla con la variable de entorno TZ."""
    hoy = datetime.now().date()
    tz_local = datetime.now().astimezone().tzinfo
    inicio = datetime.combine(fecha_inicio or hoy, time.min, tz_local)
    fin = datetime.combine(fecha_fin or hoy, time.max, tz_local)

    query = _entre(_query(), inicio, fin)
    if empleado_id is not None:
        _verificar_empleado(db, empleado_id)
        query = query.where(RegistroBlusa.usuario_id == empleado_id)
    return _listar(db, query)


def _query() -> Select[tuple[RegistroBlusa]]:
    return select(RegistroBlusa).options(joinedload(RegistroBlusa.usuario))


def _entre(query: Select, inicio: datetime, fin: datetime) -> Select:
    return query.where(RegistroBlusa.fecha_registro.between(inicio, fin))


def _listar(db: Session, query: Select) -> list[RegistroDTO]:
    registros = db.scalars(query.order_by(RegistroBlusa.fecha_registro.desc()))
    return [RegistroDTO.de(r) for r in registros]


def _verificar_empleado(db: Session, empleado_id: int) -> None:
    if db.get(Usuario, empleado_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empleado no encontrado")
