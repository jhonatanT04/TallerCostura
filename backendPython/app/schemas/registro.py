from datetime import UTC, datetime

from app.models import RegistroBlusa
from app.schemas.common import CamelModel
from app.schemas.empleado import EmpleadoResponse


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
