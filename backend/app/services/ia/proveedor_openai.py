import json
from typing import Any

import openai

from app.schemas.asistente import MensajeChat
from app.services.ia.base import (
    MAX_VUELTAS,
    RESPUESTA_RECHAZO,
    DefinicionHerramienta,
    DemasiadasVueltas,
    Ejecutor,
    ErrorProveedor,
)


class ProveedorOpenAI:
    """OpenAI con la Responses API y function calling."""

    nombre = "openai"

    def __init__(self, api_key: str, modelo: str):
        self.modelo = modelo
        self._cliente = openai.OpenAI(api_key=api_key, timeout=90.0)

    def responder(
        self,
        *,
        sistema: str,
        mensajes: list[MensajeChat],
        herramientas: list[DefinicionHerramienta],
        ejecutar: Ejecutor,
    ) -> str:
        tools = [
            {
                "type": "function",
                "name": h.nombre,
                "description": h.descripcion,
                "parameters": h.parametros,
                "strict": False,  # strict exige que todos los campos sean obligatorios
            }
            for h in herramientas
        ]
        entrada: list[Any] = [{"role": m.rol, "content": m.texto} for m in mensajes]

        for _ in range(MAX_VUELTAS):
            respuesta = self._crear(instructions=sistema, input=entrada, tools=tools)
            llamadas = [o for o in respuesta.output if o.type == "function_call"]
            if not llamadas:
                if any(_es_rechazo(o) for o in respuesta.output):
                    return RESPUESTA_RECHAZO
                return respuesta.output_text

            # Se devuelven todos los ítems de salida (incluido el razonamiento) sin tocarlos.
            entrada.extend(respuesta.output)
            for llamada in llamadas:
                contenido, _ = ejecutar(llamada.name, _argumentos(llamada.arguments))
                entrada.append(
                    {"type": "function_call_output", "call_id": llamada.call_id, "output": contenido}
                )
        raise DemasiadasVueltas()

    def _crear(self, **kwargs):
        try:
            return self._cliente.responses.create(model=self.modelo, **kwargs)
        except (openai.AuthenticationError, openai.PermissionDeniedError) as e:
            raise ErrorProveedor("credenciales", str(e)) from e
        except openai.RateLimitError as e:
            raise ErrorProveedor("limite", str(e)) from e
        except openai.APIStatusError as e:
            raise ErrorProveedor("servicio", f"{e.status_code} {e.message}") from e
        except openai.APIConnectionError as e:
            raise ErrorProveedor("conexion", str(e)) from e


def _argumentos(texto: str) -> dict[str, Any]:
    try:
        valor = json.loads(texto or "{}")
    except json.JSONDecodeError:
        return {}
    return valor if isinstance(valor, dict) else {}


def _es_rechazo(item: Any) -> bool:
    return item.type == "message" and any(
        getattr(c, "type", None) == "refusal" for c in getattr(item, "content", [])
    )
