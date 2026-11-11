import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, Enum, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.usuario import Usuario

_ID = BigInteger().with_variant(Integer, "sqlite")
_MONEY = Numeric(10, 2)


class EstadoPago(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"


class ConfiguracionPago(Base):
    """Fila única global: lo que se paga a CUALQUIER empleada por cada blusa con
    mullos/ataches. Se crea con ceros la primera vez que se lee."""

    __tablename__ = "configuracion_pago"

    id: Mapped[int] = mapped_column(_ID, primary_key=True, autoincrement=True)
    precio_mullos: Mapped[Decimal] = mapped_column(_MONEY, nullable=False, default=Decimal("0"))
    precio_ataches: Mapped[Decimal] = mapped_column(_MONEY, nullable=False, default=Decimal("0"))


class OrdenPago(Base):
    """Pago semanal calculado para una empleada. Los montos son una foto congelada al
    momento del cálculo: no cambian si después cambian las tarifas."""

    __tablename__ = "ordenes_pago"

    id: Mapped[int] = mapped_column(_ID, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("usuarios.id"), nullable=False)
    usuario: Mapped[Usuario] = relationship(lazy="raise")
    semana_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    semana_fin: Mapped[date] = mapped_column(Date, nullable=False)
    total_blusas: Mapped[int] = mapped_column(Integer, nullable=False)
    total_con_mullos: Mapped[int] = mapped_column(Integer, nullable=False)
    total_con_ataches: Mapped[int] = mapped_column(Integer, nullable=False)
    monto_blusas: Mapped[Decimal] = mapped_column(_MONEY, nullable=False)
    monto_mullos: Mapped[Decimal] = mapped_column(_MONEY, nullable=False)
    monto_ataches: Mapped[Decimal] = mapped_column(_MONEY, nullable=False)
    monto_total: Mapped[Decimal] = mapped_column(_MONEY, nullable=False)
    estado: Mapped[EstadoPago] = mapped_column(
        Enum(EstadoPago, native_enum=False, length=255), nullable=False
    )
    fecha_pago: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
