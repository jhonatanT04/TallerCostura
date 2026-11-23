"""Servidor MCP del taller: expone las consultas de solo lectura como herramientas.

Lo usan el chat del panel (en proceso, ver `app.services.asistente_service`) y, si se
configura `MCP_TOKEN`, cualquier cliente MCP por HTTP en `/mcp` (ver `mcp_server.http`).
"""

from collections.abc import Callable
from typing import Annotated, Any

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import Field

from app.database import SessionLocal
from mcp_server import consultas

servidor = MCPServer(
    name="costureria",
    title="Taller de costura",
    instructions=(
        "Consultas de solo lectura sobre un taller de costura de blusas: empleadas, "
        "producción (confección, mullos, ataches), pagos semanales (lunes a domingo, en "
        "dólares), clientes y órdenes. Ninguna herramienta modifica datos."
    ),
)

_SOLO_LECTURA = ToolAnnotations(readOnlyHint=True, destructiveHint=False, openWorldHint=False)

Fecha = Annotated[str, Field(description="Fecha AAAA-MM-DD")]
FechaOpcional = Annotated[str | None, Field(description="Opcional: fecha AAAA-MM-DD")]
IdEmpleado = Annotated[int, Field(description="Id de la empleada (ver listar_empleados)")]
IdEmpleadoOpcional = Annotated[
    int | None, Field(description="Opcional: id de la empleada (ver listar_empleados)")
]


def _consultar(funcion: Callable[..., dict], **kwargs: Any) -> dict:
    # Una sesión por llamada: las herramientas corren en hilos del SDK.
    with SessionLocal() as db:
        try:
            return funcion(db, **kwargs)
        except consultas.ErrorConsulta as e:
            raise ToolError(str(e)) from e


def _herramienta(descripcion: str):
    return servidor.tool(description=descripcion, annotations=_SOLO_LECTURA)


@_herramienta(
    "Lista las empleadas del taller (sin las eliminadas) con su id, nombre, usuario, si su "
    "cuenta está activa y su tarifa por blusa confeccionada. Úsala para encontrar el id de "
    "una empleada a partir de su nombre."
)
def listar_empleados() -> dict:
    return _consultar(consultas.listar_empleados)


@_herramienta("Precios globales que se pagan por cada blusa con mullos y con ataches.")
def configuracion_pagos() -> dict:
    return _consultar(consultas.configuracion_pagos)


@_herramienta(
    "Suma la producción registrada entre dos fechas (ambas incluidas): blusas "
    "confeccionadas, con mullos y con ataches, en total, por empleada, por color y por talla. "
    "Con empleado_id solo cuenta el trabajo de esa empleada. Máximo 366 días."
)
def resumen_produccion(
    fecha_inicio: Fecha, fecha_fin: Fecha, empleado_id: IdEmpleadoOpcional = None
) -> dict:
    return _consultar(
        consultas.resumen_produccion,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        empleado_id=empleado_id,
    )


@_herramienta(
    "Calcula cuánto se le debe a una empleada por una semana (lunes a domingo) con el mismo "
    "cálculo que la página de Pagos, o devuelve el pago ya registrado si esa semana ya se "
    "pagó. Cualquier fecha se ajusta al lunes de su semana. No registra ningún pago; el "
    "campo accion_pendiente es para la aplicación."
)
def pago_semanal(
    empleado_id: IdEmpleado,
    semana_inicio: Annotated[str, Field(description="Una fecha de la semana, AAAA-MM-DD")],
) -> dict:
    return _consultar(consultas.pago_semanal, empleado_id=empleado_id, semana_inicio=semana_inicio)


@_herramienta(
    "Historial de pagos ya registrados, del más reciente al más antiguo, con su desglose y la "
    "suma total. Se puede filtrar por empleada y por semana (desde/hasta comparan el lunes de "
    "cada semana pagada)."
)
def pagos_registrados(
    empleado_id: IdEmpleadoOpcional = None,
    desde: FechaOpcional = None,
    hasta: FechaOpcional = None,
) -> dict:
    return _consultar(consultas.pagos_registrados, empleado_id=empleado_id, desde=desde, hasta=hasta)


@_herramienta(
    "Lista los clientes con su id y teléfono. Con buscar, filtra por parte del nombre."
)
def listar_clientes(
    buscar: Annotated[str | None, Field(description="Opcional: parte del nombre")] = None,
) -> dict:
    return _consultar(consultas.listar_clientes, buscar=buscar)


@_herramienta(
    "Órdenes de clientes, de la más reciente a la más antigua, con sus ítems por color "
    "(cantidad y precio), total de blusas y total en dólares. Se puede filtrar por cliente y "
    "por fecha de creación."
)
def ordenes(
    cliente_id: Annotated[
        int | None, Field(description="Opcional: id del cliente (ver listar_clientes)")
    ] = None,
    desde: FechaOpcional = None,
    hasta: FechaOpcional = None,
) -> dict:
    return _consultar(consultas.ordenes, cliente_id=cliente_id, desde=desde, hasta=hasta)

