"""Expone el servidor MCP por HTTP (Streamable HTTP) en `/mcp`, dentro de la misma API.

Solo se activa si hay `MCP_TOKEN`: los clientes deben mandar `Authorization: Bearer <token>`.
Sin token, `/mcp` no existe y el servidor solo se usa en proceso desde el chat del panel.
"""

import hmac
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from mcp.server.transport_security import TransportSecuritySettings
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.types import ASGIApp, Receive, Scope, Send

from mcp_server.servidor import servidor

RUTA = "/mcp"


class _RequiereToken:
    def __init__(self, app: ASGIApp, token: str):
        self.app = app
        self.esperado = f"Bearer {token}".encode()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        recibido = dict(scope.get("headers") or []).get(b"authorization", b"")
        if not hmac.compare_digest(recibido, self.esperado):
            respuesta = JSONResponse(
                {"message": "No autenticado"},
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )
            await respuesta(scope, receive, send)
            return
        await self.app(scope, receive, send)


def montar(app: FastAPI, token: str) -> None:
    """Agrega la ruta `/mcp` a la app. Hay que correr `sesiones_mcp()` en el lifespan."""
    mcp_app = servidor.streamable_http_app(
        streamable_http_path=RUTA,
        # Sin estado: cada petición es independiente (sirve con varias instancias en Render).
        stateless_http=True,
        json_response=True,
        # La protección contra DNS rebinding es para servidores locales sin autenticación;
        # aquí el acceso ya exige token y el Host público varía según el despliegue.
        transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
    )
    ruta = next(r for r in mcp_app.routes if isinstance(r, Route) and r.path == RUTA)
    app.router.routes.append(Route(RUTA, endpoint=_RequiereToken(ruta.app, token)))


@asynccontextmanager
async def sesiones_mcp() -> AsyncIterator[None]:
    async with servidor.session_manager.run():
        yield
