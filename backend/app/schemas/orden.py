from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import AfterValidator, Field
from pydantic_core import PydanticCustomError

from app.models import Cliente, Orden
from app.schemas.common import CamelModel, Money, NotBlank, utc


class CrearClienteRequest(CamelModel):
    nombre: NotBlank
    telefono: str | None = None


class ClienteResponse(CamelModel):
    id: int
    nombre: str
    telefono: str | None

    @classmethod
    def de(cls, c: Cliente) -> "ClienteResponse":
        return cls(id=c.id, nombre=c.nombre, telefono=c.telefono)


def _cantidad_min_1(v: int) -> int:
    if v < 1:
        raise PydanticCustomError("min", "La cantidad debe ser al menos 1")
    return v


def _precio_positivo(v: Decimal) -> Decimal:
    if v <= 0:
        raise PydanticCustomError("decimal_min", "El precio debe ser mayor a 0")
    return v


def _no_vacia(v: list | None) -> list:
    if not v:
        raise PydanticCustomError("not_empty", "La orden debe tener al menos un grupo de blusas")
    return v


class ItemOrdenRequest(CamelModel):
    color: NotBlank
    cantidad: Annotated[int, AfterValidator(_cantidad_min_1)] = 0  # int primitivo en Java
    precio_unitario: Annotated[Decimal, AfterValidator(_precio_positivo)]


class CrearOrdenRequest(CamelModel):
    cliente_id: int
    items: Annotated[list[ItemOrdenRequest] | None, AfterValidator(_no_vacia)] = Field(
        default=None, validate_default=True
    )


class ItemOrdenDTO(CamelModel):
    id: int
    color: str
    cantidad: int
    precio_unitario: Money
    subtotal: Money


class OrdenDTO(CamelModel):
    id: int
    cliente: ClienteResponse
    fecha_creacion: datetime
    items: list[ItemOrdenDTO]
    total_blusas: int
    total: Money

    @classmethod
    def de(cls, o: Orden) -> "OrdenDTO":
        items = [
            ItemOrdenDTO(
                id=i.id,
                color=i.color,
                cantidad=i.cantidad,
                precio_unitario=i.precio_unitario,
                subtotal=i.precio_unitario * i.cantidad,
            )
            for i in o.items
        ]
        return cls(
            id=o.id,
            cliente=ClienteResponse.de(o.cliente),
            fecha_creacion=utc(o.fecha_creacion),
            items=items,
            total_blusas=sum(i.cantidad for i in items),
            total=sum((i.subtotal for i in items), Decimal("0")),
        )
