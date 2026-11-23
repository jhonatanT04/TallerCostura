from typing import Any

import anthropic

from app.schemas.asistente import MensajeChat
from app.services.ia.base import (
    MAX_VUELTAS,
    RESPUESTA_RECHAZO,
    DefinicionHerramienta,
    DemasiadasVueltas,
    Ejecutor,
    ErrorProveedor,
)

# Modelos que aceptan `effort` y el respaldo automático del servidor ante rechazos
# (`fallbacks: "default"`). Con otros modelos se manda una petición simple.
_MODELOS_CON_FALLBACK = {
    "claude-opus-5-5",
    "claude-opus-5",
    "claude-sonnet-5-5",
    "claude-fable-5-2",
    "claude-fable-5-1",
}
BETA_FALLBACK = "server-side-fallback-2026-07-01"


class ProveedorAnthropic:
    """Claude con la Messages API y tool use."""

    nombre = "anthropic"

    def __init__(self, api_key: str, modelo: str):
        self.modelo = modelo
        self._cliente = anthropic.Anthropic(api_key=api_key, timeout=90.0)

    def responder(
        self,
        *,
        sistema: str,
        mensajes: list[MensajeChat],
        herramientas: list[DefinicionHerramienta],
        ejecutar: Ejecutor,
    ) -> str:
        tools = [
            {"name": h.nombre, "description": h.descripcion, "input_schema": h.parametros}
            for h in herramientas
        ]
        messages: list[dict[str, Any]] = [{"role": m.rol, "content": m.texto} for m in mensajes]

        for _ in range(MAX_VUELTAS):
            respuesta = self._crear(system=sistema, tools=tools, messages=messages)

            if respuesta.stop_reason == "refusal":
                return RESPUESTA_RECHAZO

            if respuesta.stop_reason == "tool_use":
                # Se agrega el contenido completo (incluidos los bloques de thinking) sin tocarlo.
                messages.append({"role": "assistant", "content": respuesta.content})
                resultados = []
                for bloque in respuesta.content:
                    if bloque.type != "tool_use":
                        continue
                    contenido, es_error = ejecutar(bloque.name, dict(bloque.input))
                    resultados.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": bloque.id,
                            "content": contenido,
                            "is_error": es_error,
                        }
                    )
                # Todos los resultados van juntos en un solo mensaje.
                messages.append({"role": "user", "content": resultados})
                continue

            return "".join(b.text for b in respuesta.content if b.type == "text")
        raise DemasiadasVueltas()

    def _crear(self, **kwargs):
        try:
            if self.modelo in _MODELOS_CON_FALLBACK:
                return self._cliente.beta.messages.create(
                    model=self.modelo,
                    max_tokens=16000,
                    output_config={"effort": "medium"},
                    betas=[BETA_FALLBACK],
                    fallbacks="default",
                    **kwargs,
                )
            return self._cliente.messages.create(model=self.modelo, max_tokens=16000, **kwargs)
        except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as e:
            raise ErrorProveedor("credenciales", str(e)) from e
        except anthropic.RateLimitError as e:
            raise ErrorProveedor("limite", str(e)) from e
        except anthropic.APIStatusError as e:
            raise ErrorProveedor("servicio", f"{e.status_code} {e.message}") from e
        except anthropic.APIConnectionError as e:
            raise ErrorProveedor("conexion", str(e)) from e
