from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

_ID = BigInteger().with_variant(Integer, "sqlite")


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(_ID, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(255))


class Orden(Base):
    __tablename__ = "ordenes"

    id: Mapped[int] = mapped_column(_ID, primary_key=True, autoincrement=True)
    cliente_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("clientes.id"), nullable=False)
    cliente: Mapped[Cliente] = relationship(lazy="raise")
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    items: Mapped[list["OrdenItem"]] = relationship(
        back_populates="orden",
        cascade="all, delete-orphan",
        order_by="OrdenItem.id",
        lazy="raise",
    )


class OrdenItem(Base):
    """Un grupo de color dentro de una orden (p. ej. "12 verdes a $3.50").

    El precio va en el ítem, no en la orden, porque varía por orden e incluso por color.
    """

    __tablename__ = "orden_items"

    id: Mapped[int] = mapped_column(_ID, primary_key=True, autoincrement=True)
    orden_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("ordenes.id"), nullable=False)
    orden: Mapped[Orden] = relationship(back_populates="items", lazy="raise")
    color: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
