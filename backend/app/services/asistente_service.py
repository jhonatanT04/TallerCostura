"""Chat del panel de administración con IA.

El proveedor (OpenAI, Gemini o Anthropic) y el modelo se eligen con variables de entorno;
ver `app.services.ia`. El servidor no guarda conversaciones: el frontend manda el historial
(solo texto) en cada pregunta, y el proveedor corre el ciclo de herramientas.
"""

import logging
from datetime import date, timedelta

from fastapi import HTTPException, status

from app.config import get_settings
from app.schemas.asistente import ChatRequest, ChatResponse
from app.services import asistente_mcp
from app.services.fechas import hoy_local
from app.services.ia import crear_proveedor
from app.services.ia.base import DemasiadasVueltas, ErrorProveedor, Proveedor

log = logging.getLogger(__name__)

_DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
_MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
          "septiembre", "octubre", "noviembre", "diciembre"]

_INSTRUCCIONES = """\
Eres el asistente del panel de administración de un taller de costura que confecciona \
blusas. Hablas con la administradora (la jefa) en español, con respuestas breves y claras, \
en texto simple sin tablas ni encabezados.

Cómo funciona el taller:
- Las empleadas registran su trabajo por color y talla. Hay tres trabajos independientes: \
confeccionar la blusa, ponerle mullos y ponerle ataches. Una empleada puede poner mullos o \
ataches a blusas que confeccionó otra.
- "Blusas hechas" se refiere a blusas confeccionadas, salvo que pregunten por mullos o ataches.
- El pago es semanal, de lunes a domingo: blusas confeccionadas × la tarifa por blusa de esa \
empleada, más blusas con mullos × el precio de mullos, más blusas con ataches × el precio de \
ataches (estos dos precios son los mismos para todas). Los montos son en dólares.

Saca todas las cifras de las herramientas; no inventes ni estimes números. Si un nombre \
coincide con varias empleadas o con ninguna, pregunta a cuál se refiere.

Tú no puedes registrar pagos. Cuando consultes un pago que está PENDIENTE y tiene monto, la \
aplicación le mostrará a la jefa, debajo de tu respuesta, un botón para confirmar si ya le \
pagó a la empleada. Di cuánto se le debe y que puede confirmarlo con ese botón; nunca digas \
que el pago quedó registrado. Si la semana todavía está en curso, aclara que el monto puede \
subir si la empleada registra más trabajo.

Solo ayudas con temas del taller: producción, empleadas, pagos, clientes y órdenes."""

_MENSAJES_ERROR = {
    "configuracion": (status.HTTP_503_SERVICE_UNAVAILABLE, "El asistente no está configurado"),
    "credenciales": (status.HTTP_503_SERVICE_UNAVAILABLE, "El asistente no está configurado correctamente"),
    "limite": (status.HTTP_503_SERVICE_UNAVAILABLE, "El asistente está ocupado, intenta en un momento"),
    "servicio": (status.HTTP_502_BAD_GATEWAY, "El asistente falló, intenta de nuevo"),
    "conexion": (status.HTTP_502_BAD_GATEWAY, "No se pudo contactar al asistente"),
}


def conversar(request: ChatRequest) -> ChatResponse:
    try:
        proveedor = obtener_proveedor()
    except ErrorProveedor as e:
        raise _error_http(e) from e

    # Las consultas a la base de datos las hace el servidor MCP (carpeta mcp_server/).
    # Los errores se lanzan después de cerrar la conexión: dentro del bloque, el cliente MCP
    # asíncrono los envolvería en un ExceptionGroup.
    error: ErrorProveedor | None = None
    texto = ""
    with asistente_mcp.conectar() as herramientas:
        try:
            texto = proveedor.responder(
                sistema=f"{_INSTRUCCIONES}\n\n{_contexto_fecha(hoy_local())}",
                mensajes=request.mensajes,
                herramientas=herramientas.definiciones,
                ejecutar=herramientas.ejecutar,
            )
        except DemasiadasVueltas:
            log.warning("El asistente superó el tope de vueltas de herramientas")
            texto = "La consulta fue demasiado larga. ¿Puedes hacerla más específica?"
        except ErrorProveedor as e:
            error = e
        acciones = herramientas.acciones
    if error is not None:
        raise _error_http(error) from error

    texto = texto.strip() or "No pude armar una respuesta. ¿Puedes preguntarlo de otra forma?"
    return ChatResponse(respuesta=texto, acciones=acciones)


def _error_http(e: ErrorProveedor) -> HTTPException:
    log.error("Error del proveedor de IA (%s): %s", e.tipo, e.detalle)
    codigo, mensaje = _MENSAJES_ERROR[e.tipo]
    return HTTPException(codigo, mensaje)


_proveedor: Proveedor | None = None


def obtener_proveedor() -> Proveedor:
    """Un solo cliente por proceso (reutiliza conexiones). Se crea en la primera pregunta,
    así que una configuración incompleta no impide que arranque la API."""
    global _proveedor
    if _proveedor is None:
        _proveedor = crear_proveedor(get_settings())
        log.info("Asistente usando %s / %s", _proveedor.nombre, _proveedor.modelo)
    return _proveedor


def _contexto_fecha(hoy: date) -> str:
    lunes = hoy - timedelta(days=hoy.weekday())
    return (
        f"Hoy es {_DIAS[hoy.weekday()]} {hoy.day} de {_MESES[hoy.month - 1]} de {hoy.year} "
        f"({hoy.isoformat()}). La semana actual va del lunes {lunes.isoformat()} al domingo "
        f"{(lunes + timedelta(days=6)).isoformat()}; la semana pasada empezó el lunes "
        f"{(lunes - timedelta(days=7)).isoformat()}."
    )
