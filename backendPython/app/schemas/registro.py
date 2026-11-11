from datetime import UTC, datetime
from typing import Annotated

from pydantic import AfterValidator
from pydantic_core import PydanticCustomError

from app.models import RegistroBlusa
from app.schemas.common import CamelModel, NotBlank
from app.schemas.empleado import EmpleadoResponse


def _min_0(trabajo: str):
    def check(v: int) -> int:
        if v < 0:
            raise PydanticCustomError("min", f"La cantidad de {trabajo} no puede ser negativa")
        return v

    return AfterValidator(check)


class CrearRegistroRequest(CamelModel):
    color: NotBlank
    talla: NotBlank
    # En Java son `int` primitivos: si no se envían valen 0.
    cantidad_confeccion: Annotated[int, _min_0("confección")] = 0
    cantidad_mullos: Annotated[int, _min_0("mullos")] = 0
    cantidad_ataches: Annotated[int, _min_0("ataches")] = 0


class RegistroDTO(CamelModel):
    id: int
    color: str
    talla: str
    cantidad_confeccion: int
    cantidad_mullos: int
    cantidad_ataches: int
    fecha_registro: datetime
    empleado: EmpleadoResponse

    @classmethod
    def de(cls, r: RegistroBlusa) -> "RegistroDTO":
        return cls(
            id=r.id,
            color=r.color,
            talla=r.talla,
            cantidad_confeccion=r.cantidad_confeccion,
            cantidad_mullos=r.cantidad_mullos,
            cantidad_ataches=r.cantidad_ataches,
            fecha_registro=_utc(r.fecha_registro),
            empleado=EmpleadoResponse.de(r.usuario),
        )


def _utc(dt: datetime) -> datetime:
    # Igual que un Instant de Java: siempre en UTC ("...Z"), sin importar la zona
    # horaria de la sesión de Postgres. SQLite (tests) devuelve fechas sin zona.
    return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt.astimezone(UTC)
