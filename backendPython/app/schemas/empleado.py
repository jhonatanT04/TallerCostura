from decimal import Decimal
from typing import Annotated

from pydantic import AfterValidator
from pydantic_core import PydanticCustomError

from app.models import Usuario
from app.schemas.common import CamelModel, Money, NotBlank, Password


def _no_negativo(v: Decimal | None) -> Decimal | None:
    if v is not None and v < 0:
        raise PydanticCustomError("decimal_min", "El pago por blusa no puede ser negativo")
    return v


def _mayor_a_cero(v: Decimal) -> Decimal:
    if v <= 0:
        raise PydanticCustomError("decimal_min", "La tarifa por blusa debe ser mayor a 0")
    return v


class CrearEmpleadoRequest(CamelModel):
    username: NotBlank
    password: Password
    nombre_completo: NotBlank
    # Opcional: si no se envía queda en 0 (el cálculo de pagos rechaza tarifas en 0).
    pago_por_blusa: Annotated[Decimal | None, AfterValidator(_no_negativo)] = None


class ActualizarPagoEmpleadoRequest(CamelModel):
    pago_por_blusa: Annotated[Decimal, AfterValidator(_mayor_a_cero)]


class CambiarPasswordRequest(CamelModel):
    password: Password


class EmpleadoResponse(CamelModel):
    id: int
    username: str
    nombre_completo: str
    activo: bool
    pago_por_blusa: Money

    @classmethod
    def de(cls, u: Usuario) -> "EmpleadoResponse":
        return cls(
            id=u.id,
            username=u.username,
            nombre_completo=u.nombre_completo,
            activo=u.activo,
            pago_por_blusa=u.pago_por_blusa,
        )
