from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import AfterValidator
from pydantic_core import PydanticCustomError

from app.models import ConfiguracionPago, EstadoPago, OrdenPago
from app.schemas.common import CamelModel, Money, utc
from app.schemas.empleado import EmpleadoResponse


def _no_negativo(v: Decimal) -> Decimal:
    if v < 0:
        raise PydanticCustomError("decimal_min", "El precio no puede ser negativo")
    return v


Precio = Annotated[Decimal, AfterValidator(_no_negativo)]


class ConfiguracionPagoRequest(CamelModel):
    precio_mullos: Precio
    precio_ataches: Precio


class ConfiguracionPagoDTO(CamelModel):
    precio_mullos: Money
    precio_ataches: Money

    @classmethod
    def de(cls, c: ConfiguracionPago) -> "ConfiguracionPagoDTO":
        return cls(precio_mullos=c.precio_mullos, precio_ataches=c.precio_ataches)


class CalcularPagoRequest(CamelModel):
    empleado_id: int
    semana_inicio: date


class OrdenPagoDTO(CamelModel):
    id: int | None
    empleado: EmpleadoResponse
    semana_inicio: date
    semana_fin: date
    total_blusas: int
    total_con_mullos: int
    total_con_ataches: int
    monto_blusas: Money
    monto_mullos: Money
    monto_ataches: Money
    monto_total: Money
    estado: EstadoPago
    fecha_pago: datetime | None

    @classmethod
    def de(cls, p: OrdenPago) -> "OrdenPagoDTO":
        return cls(
            id=p.id,
            empleado=EmpleadoResponse.de(p.usuario),
            semana_inicio=p.semana_inicio,
            semana_fin=p.semana_fin,
            total_blusas=p.total_blusas,
            total_con_mullos=p.total_con_mullos,
            total_con_ataches=p.total_con_ataches,
            monto_blusas=p.monto_blusas,
            monto_mullos=p.monto_mullos,
            monto_ataches=p.monto_ataches,
            monto_total=p.monto_total,
            estado=p.estado,
            fecha_pago=utc(p.fecha_pago) if p.fecha_pago else None,
        )
