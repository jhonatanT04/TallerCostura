from datetime import date
from typing import Annotated, Literal

from pydantic import Field, StringConstraints, field_validator

from app.schemas.common import CamelModel, Money

TextoMensaje = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]


class MensajeChat(CamelModel):
    rol: Literal["user", "assistant"]
    texto: TextoMensaje


class ChatRequest(CamelModel):
    """Historial completo de la conversación (el servidor no guarda nada entre mensajes).
    El último mensaje es la pregunta nueva de la ADMIN."""

    mensajes: Annotated[list[MensajeChat], Field(min_length=1, max_length=40)]

    @field_validator("mensajes")
    @classmethod
    def _empieza_y_termina_en_user(cls, v: list[MensajeChat]) -> list[MensajeChat]:
        if v[0].rol != "user" or v[-1].rol != "user":
            raise ValueError("la conversación debe empezar y terminar con un mensaje del usuario")
        return v


class AccionConfirmarPago(CamelModel):
    """El asistente nunca registra pagos: le propone a la ADMIN confirmar uno, y el
    frontend lo registra con POST /api/pagos/calcular (que recalcula el monto)."""

    tipo: Literal["CONFIRMAR_PAGO"] = "CONFIRMAR_PAGO"
    empleado_id: int
    empleado_nombre: str
    semana_inicio: date
    semana_fin: date
    monto_total: Money


class ChatResponse(CamelModel):
    respuesta: str
    acciones: list[AccionConfirmarPago] = []
