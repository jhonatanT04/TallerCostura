"""Consultas de solo lectura que expone el servidor MCP.

Reutilizan los modelos y servicios de `app`, así que los montos son exactamente los mismos
que muestra la página de Pagos. Ninguna crea ni modifica datos de negocio.
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Cliente, ConfiguracionPago, Orden, OrdenPago, RegistroBlusa, Role, Usuario
from app.services import pago_service
from app.services.fechas import hoy_local, rango_local

MAX_DIAS_RANGO = 366
MAX_RESULTADOS = 50


class ErrorConsulta(Exception):
    """Error que se le explica al modelo (datos inválidos, empleada inexistente, etc.)."""


def listar_empleados(db: Session) -> dict:
    usuarios = db.scalars(
        select(Usuario)
        .where(Usuario.role == Role.EMPLEADO, Usuario.eliminado.is_(False))
        .order_by(Usuario.nombre_completo)
    )
    return {
        "empleados": [
            {
                "id": u.id,
                "nombre": u.nombre_completo,
                "usuario": u.username,
                "activo": u.activo,
                "tarifa_por_blusa": _num(u.pago_por_blusa),
            }
            for u in usuarios
        ]
    }


def configuracion_pagos(db: Session) -> dict:
    # Se lee sin crear la fila: si no existe, los precios son 0.
    config = db.scalar(select(ConfiguracionPago).order_by(ConfiguracionPago.id).limit(1))
    return {
        "precio_mullos": _num(config.precio_mullos) if config else 0.0,
        "precio_ataches": _num(config.precio_ataches) if config else 0.0,
        "nota": "La tarifa por blusa confeccionada es de cada empleada (ver listar_empleados).",
    }


def resumen_produccion(
    db: Session, fecha_inicio: str, fecha_fin: str, empleado_id: int | None = None
) -> dict:
    desde, hasta = _rango(fecha_inicio, fecha_fin)
    if empleado_id is not None:
        _empleado(db, empleado_id)

    inicio, fin = rango_local(desde, hasta)
    filtros = [RegistroBlusa.fecha_registro.between(inicio, fin)]
    if empleado_id is not None:
        filtros.append(RegistroBlusa.usuario_id == empleado_id)

    sumas = (
        func.coalesce(func.sum(RegistroBlusa.cantidad_confeccion), 0),
        func.coalesce(func.sum(RegistroBlusa.cantidad_mullos), 0),
        func.coalesce(func.sum(RegistroBlusa.cantidad_ataches), 0),
    )
    confeccion, mullos, ataches, registros = db.execute(
        select(*sumas, func.count(RegistroBlusa.id)).where(*filtros)
    ).one()

    por_empleado = db.execute(
        select(Usuario.id, Usuario.nombre_completo, *sumas)
        .join(Usuario, Usuario.id == RegistroBlusa.usuario_id)
        .where(*filtros)
        .group_by(Usuario.id, Usuario.nombre_completo)
        .order_by(sumas[0].desc())
    ).all()

    # El color es texto libre: se agrupa sin distinguir mayúsculas ni espacios.
    color = func.lower(func.trim(RegistroBlusa.color))
    por_color = db.execute(
        select(color, *sumas).where(*filtros).group_by(color).order_by(sumas[0].desc())
    ).all()

    talla = RegistroBlusa.talla
    por_talla = db.execute(
        select(talla, *sumas).where(*filtros).group_by(talla).order_by(sumas[0].desc())
    ).all()

    return {
        "desde": desde.isoformat(),
        "hasta": hasta.isoformat(),
        "total": {
            "confeccion": confeccion,
            "mullos": mullos,
            "ataches": ataches,
            "registros": registros,
        },
        "por_empleado": [
            {"id": i, "nombre": n, "confeccion": c, "mullos": m, "ataches": a}
            for i, n, c, m, a in por_empleado
        ],
        "por_color": [
            {"color": col, "confeccion": c, "mullos": m, "ataches": a}
            for col, c, m, a in por_color
        ],
        "por_talla": [
            {"talla": t, "confeccion": c, "mullos": m, "ataches": a}
            for t, c, m, a in por_talla
        ],
    }


def pago_semanal(db: Session, empleado_id: int, semana_inicio: str) -> dict:
    """Si la semana está pendiente y tiene monto, incluye `accion_pendiente`: el chat del
    panel la usa para preguntarle a la ADMIN si ya pagó (nunca se registra aquí)."""
    empleado = _empleado(db, empleado_id)
    fecha = _fecha(semana_inicio)
    lunes = fecha - timedelta(days=fecha.weekday())

    pagado = db.scalar(
        select(OrdenPago).where(OrdenPago.usuario_id == empleado.id, OrdenPago.semana_inicio == lunes)
    )
    if pagado is not None:
        return {
            "empleado": empleado.nombre_completo,
            "semana_inicio": pagado.semana_inicio.isoformat(),
            "semana_fin": pagado.semana_fin.isoformat(),
            "estado": "PAGADO",
            "fecha_pago": pagado.fecha_pago.isoformat(),
            **_desglose(pagado),
        }

    try:
        pago = pago_service.previsualizar(db, empleado.id, lunes)
    except HTTPException as e:
        # Tarifas en 0 u otra regla del cálculo: se le explica al modelo para que lo cuente.
        raise ErrorConsulta(str(e.detail)) from e

    resultado = {
        "empleado": empleado.nombre_completo,
        "semana_inicio": pago.semana_inicio.isoformat(),
        "semana_fin": pago.semana_fin.isoformat(),
        "estado": "PENDIENTE",
        "semana_en_curso": pago.semana_fin >= hoy_local(),
        **_desglose(pago),
    }
    if pago.monto_total > 0 and lunes <= hoy_local():
        resultado["accion_pendiente"] = {
            "tipo": "CONFIRMAR_PAGO",
            "empleado_id": empleado.id,
            "empleado_nombre": empleado.nombre_completo,
            "semana_inicio": pago.semana_inicio.isoformat(),
            "semana_fin": pago.semana_fin.isoformat(),
            "monto_total": _num(pago.monto_total),
        }
    return resultado


def pagos_registrados(
    db: Session,
    empleado_id: int | None = None,
    desde: str | None = None,
    hasta: str | None = None,
) -> dict:
    query = select(OrdenPago).options(joinedload(OrdenPago.usuario))
    if empleado_id is not None:
        _empleado(db, empleado_id)
        query = query.where(OrdenPago.usuario_id == empleado_id)
    if desde is not None:
        query = query.where(OrdenPago.semana_inicio >= _fecha(desde))
    if hasta is not None:
        query = query.where(OrdenPago.semana_inicio <= _fecha(hasta))

    pagos = db.scalars(query.order_by(OrdenPago.semana_inicio.desc())).all()
    return {
        "cantidad": len(pagos),
        "monto_total": _num(sum((p.monto_total for p in pagos), Decimal("0"))),
        "pagos": [
            {
                "empleado_id": p.usuario_id,
                "empleado": p.usuario.nombre_completo,
                "semana_inicio": p.semana_inicio.isoformat(),
                "semana_fin": p.semana_fin.isoformat(),
                "fecha_pago": p.fecha_pago.isoformat(),
                **_desglose(p),
            }
            for p in pagos[:MAX_RESULTADOS]
        ],
        "truncado": len(pagos) > MAX_RESULTADOS,
    }


def listar_clientes(db: Session, buscar: str | None = None) -> dict:
    query = select(Cliente).order_by(Cliente.nombre)
    if buscar and buscar.strip():
        query = query.where(func.lower(Cliente.nombre).contains(buscar.strip().lower()))
    return {
        "clientes": [
            {"id": c.id, "nombre": c.nombre, "telefono": c.telefono} for c in db.scalars(query)
        ]
    }


def ordenes(
    db: Session,
    cliente_id: int | None = None,
    desde: str | None = None,
    hasta: str | None = None,
) -> dict:
    query = select(Orden).options(joinedload(Orden.cliente), selectinload(Orden.items))
    if cliente_id is not None:
        if db.get(Cliente, cliente_id) is None:
            raise ErrorConsulta(f"No existe un cliente con id {cliente_id}")
        query = query.where(Orden.cliente_id == cliente_id)
    if desde is not None or hasta is not None:
        inicio, fin = rango_local(
            _fecha(desde) if desde else date(2000, 1, 1),
            _fecha(hasta) if hasta else hoy_local(),
        )
        query = query.where(Orden.fecha_creacion.between(inicio, fin))

    lista = db.scalars(query.order_by(Orden.fecha_creacion.desc())).all()
    resultado = []
    for o in lista[:MAX_RESULTADOS]:
        items = [
            {
                "color": i.color,
                "cantidad": i.cantidad,
                "precio_unitario": _num(i.precio_unitario),
                "subtotal": _num(i.precio_unitario * i.cantidad),
            }
            for i in o.items
        ]
        resultado.append(
            {
                "id": o.id,
                "cliente": o.cliente.nombre,
                "fecha": o.fecha_creacion.date().isoformat(),
                "total_blusas": sum(i.cantidad for i in o.items),
                "total": _num(sum((i.precio_unitario * i.cantidad for i in o.items), Decimal("0"))),
                "items": items,
            }
        )
    return {"cantidad": len(lista), "ordenes": resultado, "truncado": len(lista) > MAX_RESULTADOS}


# --- Auxiliares -----------------------------------------------------------------------------

def _empleado(db: Session, empleado_id: int) -> Usuario:
    usuario = db.get(Usuario, empleado_id)
    if usuario is None or usuario.role != Role.EMPLEADO or usuario.eliminado:
        raise ErrorConsulta(f"No existe una empleada con id {empleado_id}")
    return usuario


def _desglose(p: Any) -> dict:
    return {
        "blusas_confeccionadas": p.total_blusas,
        "con_mullos": p.total_con_mullos,
        "con_ataches": p.total_con_ataches,
        "monto_blusas": _num(p.monto_blusas),
        "monto_mullos": _num(p.monto_mullos),
        "monto_ataches": _num(p.monto_ataches),
        "monto_total": _num(p.monto_total),
    }


def _rango(fecha_inicio: str, fecha_fin: str) -> tuple[date, date]:
    desde, hasta = _fecha(fecha_inicio), _fecha(fecha_fin)
    if hasta < desde:
        raise ErrorConsulta("fecha_fin no puede ser anterior a fecha_inicio")
    if (hasta - desde).days >= MAX_DIAS_RANGO:
        raise ErrorConsulta(f"El rango no puede pasar de {MAX_DIAS_RANGO} días")
    return desde, hasta


def _fecha(valor: str) -> date:
    try:
        return date.fromisoformat(valor)
    except (TypeError, ValueError) as e:
        raise ErrorConsulta(f"Fecha inválida: {valor!r}, usa AAAA-MM-DD") from e


def _num(valor: Decimal) -> float:
    return float(valor)
