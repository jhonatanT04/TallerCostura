"""Contrato común de los proveedores de IA del asistente (OpenAI, Gemini, Anthropic).

Cada proveedor corre su propio ciclo de tool use, porque el formato de los mensajes y de
las llamadas a herramientas es distinto en cada API. El resto del backend solo ve esto.
"""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Literal, Protocol

from app.schemas.asistente import MensajeChat

# Tope de idas y vueltas modelo → herramientas por pregunta, para que nunca quede en bucle.
MAX_VUELTAS = 8

RESPUESTA_RECHAZO = "No puedo ayudar con esa consulta."


@dataclass(frozen=True)
class DefinicionHerramienta:
    nombre: str
    descripcion: str
    # JSON Schema de los argumentos. Se mantiene en el subconjunto que aceptan los tres
    # proveedores: object/string/integer, required y description (sin format ni anyOf).
    parametros: dict[str, Any]


# Recibe el nombre de la herramienta y sus argumentos; devuelve (contenido, es_error).
Ejecutor = Callable[[str, dict[str, Any]], tuple[str, bool]]


class Proveedor(Protocol):
    nombre: str
    modelo: str

    def responder(
        self,
        *,
        sistema: str,
        mensajes: list[MensajeChat],
        herramientas: list[DefinicionHerramienta],
        ejecutar: Ejecutor,
    ) -> str:
        """Devuelve el texto final. Lanza `DemasiadasVueltas` o `ErrorProveedor`."""
        ...


class DemasiadasVueltas(Exception):
    pass


TipoError = Literal["configuracion", "credenciales", "limite", "servicio", "conexion"]


class ErrorProveedor(Exception):
    def __init__(self, tipo: TipoError, detalle: str = ""):
        super().__init__(f"{tipo}: {detalle}")
        self.tipo = tipo
        self.detalle = detalle
