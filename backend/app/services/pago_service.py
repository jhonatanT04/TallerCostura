from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, joinedload

from app.models import EstadoPago, OrdenPago, RegistroBlusa, Role, Usuario
from app.schemas.pago import CalcularPagoRequest, OrdenPagoDTO
from app.services.configuracion_pago_service import obtener_entidad
from app.services.fechas import rango_local


def calcular(db: Session, request: CalcularPagoRequest) -> OrdenPagoDTO:
    # Se recalcula al confirmar, no se confía en la previsualización.
    pago = _armar_orden_pago(db, request.empleado_id, request.semana_inicio)
    pago.estado = EstadoPago.PAGADO
    pago.fecha_pago = datetime.now(UTC)
    db.add(pago)
    db.commit()
    return OrdenPagoDTO.de(pago)


def previsualizar(db: Session, empleado_id: int, semana_inicio: date) -> OrdenPagoDTO:
    """Mismo cálculo que `calcular` pero sin guardar el pago: id y fechaPago en null,
    estado PENDIENTE. Sí puede crear la configuración por defecto si no existía."""
    pago = _armar_orden_pago(db, empleado_id, semana_inicio)
    dto = OrdenPagoDTO.de(pago)
    db.commit()  # solo persiste la configuración por defecto, el pago nunca se agrega
    return dto


def listar(db: Session) -> list[OrdenPagoDTO]:
    return _listar(db, _query())


def por_empleado(db: Session, empleado_id: int) -> list[OrdenPagoDTO]:
    if db.get(Usuario, empleado_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empleado no encontrado")
    return _listar(db, _query().where(OrdenPago.usuario_id == empleado_id))


def mis_pagos(db: Session, usuario: Usuario) -> list[OrdenPagoDTO]:
    return _listar(db, _query().where(OrdenPago.usuario_id == usuario.id))


def _armar_orden_pago(db: Session, empleado_id: int, semana_inicio: date) -> OrdenPago:
    """Lógica común de `calcular` y `previsualizar` para que nunca den resultados distintos.
    Devuelve un OrdenPago transitorio (no agregado a la sesión)."""
    usuario = db.get(Usuario, empleado_id)
    if usuario is None or usuario.role != Role.EMPLEADO:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empleado no encontrado")

    semana_fin = semana_inicio + timedelta(days=6)

    ya_pagado = db.scalar(
        select(OrdenPago.id).where(
            OrdenPago.usuario_id == usuario.id, OrdenPago.semana_inicio == semana_inicio
        )
    )
    if ya_pagado is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Ya se generó el pago de la semana del {semana_inicio.isoformat()} para este empleado",
        )

    # Cada empleada cobra por el trabajo que hizo, sin importar quién confeccionó la blusa.
    inicio, fin = rango_local(semana_inicio, semana_fin)
    total_blusas, total_mullos, total_ataches = db.execute(
        select(
            func.coalesce(func.sum(RegistroBlusa.cantidad_confeccion), 0),
            func.coalesce(func.sum(RegistroBlusa.cantidad_mullos), 0),
            func.coalesce(func.sum(RegistroBlusa.cantidad_ataches), 0),
        ).where(
            RegistroBlusa.usuario_id == usuario.id,
            RegistroBlusa.fecha_registro.between(inicio, fin),
        )
    ).one()

    config = obtener_entidad(db)

    # Un pago no se puede deshacer: no se paga trabajo con tarifa 0. Se juntan todos los
    # problemas en un solo mensaje para que la ADMIN los corrija de una vez.
    sin_tarifa = []
    if total_blusas > 0 and usuario.pago_por_blusa == 0:
        sin_tarifa.append(
            f"El empleado {usuario.nombre_completo} no tiene tarifa por blusa configurada"
        )
    if total_mullos > 0 and config.precio_mullos == 0:
        sin_tarifa.append("No hay precio de mullos configurado")
    if total_ataches > 0 and config.precio_ataches == 0:
        sin_tarifa.append("No hay precio de ataches configurado")
    if sin_tarifa:
        raise HTTPException(status.HTTP_409_CONFLICT, ". ".join(sin_tarifa))

    monto_blusas = usuario.pago_por_blusa * total_blusas
    monto_mullos = config.precio_mullos * total_mullos
    monto_ataches = config.precio_ataches * total_ataches

    return OrdenPago(
        usuario=usuario,
        semana_inicio=semana_inicio,
        semana_fin=semana_fin,
        total_blusas=total_blusas,
        total_con_mullos=total_mullos,
        total_con_ataches=total_ataches,
        monto_blusas=monto_blusas,
        monto_mullos=monto_mullos,
        monto_ataches=monto_ataches,
        monto_total=monto_blusas + monto_mullos + monto_ataches,
        estado=EstadoPago.PENDIENTE,
    )


def _query() -> Select[tuple[OrdenPago]]:
    return select(OrdenPago).options(joinedload(OrdenPago.usuario))


def _listar(db: Session, query: Select) -> list[OrdenPagoDTO]:
    return [OrdenPagoDTO.de(p) for p in db.scalars(query.order_by(OrdenPago.fecha_pago.desc()))]
