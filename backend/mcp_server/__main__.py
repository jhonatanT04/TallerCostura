"""Ejecuta el servidor MCP por stdio, para clientes locales (Claude Desktop, Claude Code,
Cursor...). Usa la misma configuración que la API (.env con DB_URL, etc.):

    uv run python -m mcp_server
"""

from mcp_server.servidor import servidor

if __name__ == "__main__":
    servidor.run("stdio")
