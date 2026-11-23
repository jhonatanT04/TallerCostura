"""Cliente MCP del chat: conecta con el servidor de `mcp_server/` y adapta sus herramientas
al formato común de los proveedores de IA.

Por defecto se conecta en proceso (sin red). Con `ASISTENTE_MCP_URL` usa un servidor MCP
remoto por HTTP. Los proveedores son síncronos y el cliente MCP es asíncrono: un portal de
anyio corre el cliente en su propio event loop mientras dura la pregunta.
"""

import json
import logging
from collections.abc import AsyncIterator, Iterator
from contextlib import ExitStack, asynccontextmanager, contextmanager
from typing import Any

import httpx2
from anyio.from_thread import BlockingPortal, start_blocking_portal
from fastapi import HTTPException, status
from mcp import Client
from mcp.client.streamable_http import streamable_http_client
from mcp.types import CallToolResult, TextContent, Tool

from app.config import Settings, get_settings
from app.schemas.asistente import AccionConfirmarPago
from app.services.ia.base import DefinicionHerramienta

log = logging.getLogger(__name__)


class SesionHerramientas:
    """Herramientas del servidor MCP durante una pregunta del chat."""

    def __init__(self, portal: BlockingPortal, cliente: Client, herramientas: list[Tool]):
        self._portal = portal
        self._cliente = cliente
        self.definiciones = [
            DefinicionHerramienta(
                nombre=h.name,
                descripcion=h.description or "",
                parametros=simplificar_esquema(h.input_schema),
            )
            for h in herramientas
        ]
        self._acciones: dict[tuple[int, str], AccionConfirmarPago] = {}

    @property
    def acciones(self) -> list[AccionConfirmarPago]:
        return list(self._acciones.values())

    def ejecutar(self, nombre: str, argumentos: dict[str, Any]) -> tuple[str, bool]:
        """Ejecutor para los proveedores de IA. Devuelve (contenido, es_error)."""
        try:
            resultado: CallToolResult = self._portal.call(self._cliente.call_tool, nombre, argumentos)
        except Exception as e:  # el servidor no respondió: se le cuenta al modelo
            log.exception("Falló la herramienta MCP %s", nombre)
            return f"Error: no se pudo ejecutar {nombre} ({e})", True

        if resultado.structured_content is not None:
            contenido = json.dumps(resultado.structured_content, ensure_ascii=False)
        else:
            contenido = "\n".join(c.text for c in resultado.content if isinstance(c, TextContent))
        if resultado.is_error:
            return f"Error: {contenido}", True

        self._registrar_accion(contenido)
        return contenido, False

    def _registrar_accion(self, contenido: str) -> None:
        # `pago_semanal` incluye `accion_pendiente` cuando hay un pago para confirmar.
        try:
            datos = json.loads(contenido)
        except json.JSONDecodeError:
            return
        accion = datos.get("accion_pendiente") if isinstance(datos, dict) else None
        if isinstance(accion, dict) and accion.get("tipo") == "CONFIRMAR_PAGO":
            accion = AccionConfirmarPago.model_validate(accion)
            self._acciones[(accion.empleado_id, accion.semana_inicio.isoformat())] = accion


@contextmanager
def conectar() -> Iterator[SesionHerramientas]:
    settings = get_settings()
    with ExitStack() as pila:
        portal = pila.enter_context(start_blocking_portal())
        try:
            cliente = pila.enter_context(portal.wrap_async_context_manager(_cliente(settings)))
            herramientas = portal.call(cliente.list_tools).tools
        except Exception as e:
            log.exception("No se pudo conectar con el servidor MCP")
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY, "No se pudo conectar con el servidor de datos"
            ) from e
        yield SesionHerramientas(portal, cliente, herramientas)


@asynccontextmanager
async def _cliente(settings: Settings) -> AsyncIterator[Client]:
    url = settings.asistente_mcp_url.strip()
    if not url:
        from mcp_server.servidor import servidor  # en proceso, sin red

        async with Client(servidor) as cliente:
            yield cliente
        return

    headers = {}
    if settings.asistente_mcp_token:
        headers["Authorization"] = f"Bearer {settings.asistente_mcp_token}"
    async with httpx2.AsyncClient(headers=headers, timeout=30.0) as http:
        async with Client(streamable_http_client(url, http_client=http)) as cliente:
            yield cliente


def simplificar_esquema(esquema: Any) -> Any:
    """Deja el JSON Schema de MCP (generado por Pydantic) en el subconjunto que aceptan
    OpenAI, Gemini y Anthropic: sin `title`, y `anyOf: [T, null]` (opcional) pasa a ser `T`."""
    if isinstance(esquema, list):
        return [simplificar_esquema(e) for e in esquema]
    if not isinstance(esquema, dict):
        return esquema

    resultado: dict[str, Any] = {}
    for clave, valor in esquema.items():
        if clave == "title" or (clave == "default" and valor is None):
            continue
        if clave == "properties" and isinstance(valor, dict):
            resultado[clave] = {k: simplificar_esquema(v) for k, v in valor.items()}
        else:
            resultado[clave] = simplificar_esquema(valor)

    opciones = resultado.get("anyOf")
    if isinstance(opciones, list):
        sin_null = [o for o in opciones if o != {"type": "null"}]
        if len(sin_null) == 1 and isinstance(sin_null[0], dict):
            del resultado["anyOf"]
            resultado = {**sin_null[0], **resultado}
    return resultado
