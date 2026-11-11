from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Cliente, Orden, OrdenItem
from app.schemas.orden import CrearOrdenRequest, OrdenDTO


def crear(db: Session, request: CrearOrdenRequest) -> OrdenDTO:
    cliente = _buscar_cliente(db, request.cliente_id)
    orden = Orden(
        cliente=cliente,
        fecha_creacion=datetime.now(UTC),
        items=[
            OrdenItem(color=i.color, cantidad=i.cantidad, precio_unitario=i.precio_unitario)
            for i in request.items
        ],
    )
    db.add(orden)
    db.commit()
    return OrdenDTO.de(orden)


def listar(db: Session) -> list[OrdenDTO]:
    return _listar(db, _query())


def obtener(db: Session, id: int) -> OrdenDTO:
    orden = db.scalar(_query().where(Orden.id == id))
    if orden is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada")
    return OrdenDTO.de(orden)


def ordenes_por_cliente(db: Session, cliente_id: int) -> list[OrdenDTO]:
    _buscar_cliente(db, cliente_id)
    return _listar(db, _query().where(Orden.cliente_id == cliente_id))


def _query() -> Select[tuple[Orden]]:
    return select(Orden).options(joinedload(Orden.cliente), selectinload(Orden.items))


def _listar(db: Session, query: Select) -> list[OrdenDTO]:
    return [OrdenDTO.de(o) for o in db.scalars(query.order_by(Orden.fecha_creacion.desc()))]


def _buscar_cliente(db: Session, id: int) -> Cliente:
    cliente = db.get(Cliente, id)
    if cliente is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
    return cliente
