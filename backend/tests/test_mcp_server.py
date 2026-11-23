"""Tests del servidor MCP: las consultas, las herramientas vía un cliente MCP en proceso y
el acceso por HTTP con token."""

import asyncio
import json
from datetime import timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mcp import Client

from app.database import SessionLocal
from mcp_server import consultas
from mcp_server.http import montar, sesiones_mcp
from mcp_server.servidor import servidor
from tests.conftest import crear_empleado
from tests.test_pagos import ESPERADO, LUNES, configurar, dia, insertar, preparar_semana


def consultar(funcion, **kwargs) -> dict:
    with SessionLocal() as db:
        return funcion(db, **kwargs)


def llamar_herramienta(nombre: str, argumentos: dict):
    async def main():
        async with Client(servidor) as cliente:
            return await cliente.call_tool(nombre, argumentos)
    return asyncio.run(main())


def contenido(resultado) -> dict:
    if resultado.structured_content is not None:
        return resultado.structured_content
    return json.loads(resultado.content[0].text)


# --- Herramientas por MCP -------------------------------------------------------------------

def test_herramientas_solo_lectura():
    async def main():
        async with Client(servidor) as cliente:
            return (await cliente.list_tools()).tools
    herramientas = asyncio.run(main())
    assert len(herramientas) == 7
    assert all(h.annotations and h.annotations.read_only_hint for h in herramientas)


def test_pago_semanal_por_mcp(client, admin):
    maria, _ = preparar_semana(client, admin)
    # Gemini manda los números como float: el servidor los valida como enteros.
    resultado = llamar_herramienta("pago_semanal", {"empleado_id": float(maria["id"]),
                                                    "semana_inicio": "2026-11-04"})
    assert not resultado.is_error
    datos = contenido(resultado)
    assert datos["monto_total"] == ESPERADO["montoTotal"]
    assert datos["accion_pendiente"]["monto_total"] == 42.5


def test_error_de_consulta_por_mcp(client, admin):
    resultado = llamar_herramienta("pago_semanal", {"empleado_id": 999, "semana_inicio": "2026-11-02"})
    assert resultado.is_error
    assert "999" in resultado.content[0].text


# --- Consultas ------------------------------------------------------------------------------

def test_listar_empleados(client, admin):
    crear_empleado(client, admin, "maria", pagoPorBlusa="2.50")
    datos = consultar(consultas.listar_empleados)
    assert [(e["nombre"], e["tarifa_por_blusa"]) for e in datos["empleados"]] == [("Maria", 2.5)]


def test_configuracion_pagos_no_crea_la_fila(client, admin):
    assert consultar(consultas.configuracion_pagos)["precio_mullos"] == 0.0
    configurar(client, admin, "0.25", "0.10")
    datos = consultar(consultas.configuracion_pagos)
    assert (datos["precio_mullos"], datos["precio_ataches"]) == (0.25, 0.1)


def test_resumen_produccion(client, admin):
    maria, ana = preparar_semana(client, admin)
    insertar(ana["id"], dia(LUNES), confeccion=1)
    domingo = (LUNES + timedelta(days=6)).isoformat()

    datos = consultar(consultas.resumen_produccion, fecha_inicio=LUNES.isoformat(), fecha_fin=domingo)
    assert datos["total"] == {"confeccion": 66, "mullos": 12, "ataches": 20, "registros": 4}
    assert [(e["nombre"], e["confeccion"]) for e in datos["por_empleado"]] == [("Ana", 51), ("Maria", 15)]
    assert datos["por_color"] == [{"color": "rojo", "confeccion": 66, "mullos": 12, "ataches": 20}]
    assert datos["por_talla"] == [{"talla": "M", "confeccion": 66, "mullos": 12, "ataches": 20}]

    datos = consultar(consultas.resumen_produccion, fecha_inicio=LUNES.isoformat(), fecha_fin=domingo,
                      empleado_id=maria["id"])
    assert datos["total"]["confeccion"] == 15


def test_resumen_produccion_valida_fechas(client, admin):
    with pytest.raises(consultas.ErrorConsulta):
        consultar(consultas.resumen_produccion, fecha_inicio="2026-11-10", fecha_fin="2026-11-01")
    with pytest.raises(consultas.ErrorConsulta):
        consultar(consultas.resumen_produccion, fecha_inicio="ayer", fecha_fin="2026-11-01")


def test_pago_semanal_ajusta_al_lunes(client, admin):
    maria, _ = preparar_semana(client, admin)
    datos = consultar(consultas.pago_semanal, empleado_id=maria["id"],
                      semana_inicio=(LUNES + timedelta(days=2)).isoformat())
    assert datos["estado"] == "PENDIENTE"
    assert datos["semana_inicio"] == ESPERADO["semanaInicio"]
    assert datos["accion_pendiente"]["empleado_id"] == maria["id"]


def test_pago_semanal_ya_pagado(client, admin):
    maria, _ = preparar_semana(client, admin)
    client.post("/api/pagos/calcular", json={"empleadoId": maria["id"], "semanaInicio": "2026-11-02"},
                headers=admin)
    datos = consultar(consultas.pago_semanal, empleado_id=maria["id"], semana_inicio="2026-11-02")
    assert datos["estado"] == "PAGADO" and datos["monto_total"] == 42.5
    assert "accion_pendiente" not in datos


def test_pago_semanal_sin_trabajo_no_propone_accion(client, admin):
    maria = crear_empleado(client, admin, "maria", pagoPorBlusa="2.50")
    datos = consultar(consultas.pago_semanal, empleado_id=maria["id"], semana_inicio="2026-11-02")
    assert datos["monto_total"] == 0 and "accion_pendiente" not in datos


def test_pago_semanal_sin_tarifa_es_error(client, admin):
    maria = crear_empleado(client, admin, "maria")  # tarifa 0
    configurar(client, admin, "0.25", "0.10")
    insertar(maria["id"], dia(LUNES), confeccion=3)
    with pytest.raises(consultas.ErrorConsulta, match="tarifa"):
        consultar(consultas.pago_semanal, empleado_id=maria["id"], semana_inicio="2026-11-02")


def test_pagos_registrados(client, admin):
    maria, ana = preparar_semana(client, admin)
    for e in (maria, ana):
        r = client.post("/api/pagos/calcular", json={"empleadoId": e["id"], "semanaInicio": "2026-11-02"},
                        headers=admin)
        assert r.status_code == 201, r.text
    datos = consultar(consultas.pagos_registrados)
    assert datos["cantidad"] == 2 and datos["monto_total"] == 42.5 + 150.0
    datos = consultar(consultas.pagos_registrados, empleado_id=maria["id"], desde="2026-11-02",
                      hasta="2026-11-02")
    assert [p["monto_total"] for p in datos["pagos"]] == [42.5]
    assert consultar(consultas.pagos_registrados, desde="2026-11-03")["cantidad"] == 0


def test_clientes_y_ordenes(client, admin):
    r = client.post("/api/clientes", json={"nombre": "Tienda Rosa", "telefono": None}, headers=admin)
    cliente = r.json()
    client.post("/api/clientes", json={"nombre": "Boutique Sol", "telefono": "099"}, headers=admin)
    r = client.post("/api/ordenes", json={"clienteId": cliente["id"], "items": [
        {"color": "verde", "cantidad": 12, "precioUnitario": 3.5},
        {"color": "rojo", "cantidad": 6, "precioUnitario": 4},
    ]}, headers=admin)
    assert r.status_code == 201, r.text

    assert [c["nombre"] for c in consultar(consultas.listar_clientes, buscar="rosa")["clientes"]] == ["Tienda Rosa"]
    datos = consultar(consultas.ordenes, cliente_id=cliente["id"])
    assert datos["cantidad"] == 1
    orden = datos["ordenes"][0]
    assert (orden["cliente"], orden["total_blusas"], orden["total"]) == ("Tienda Rosa", 18, 66.0)
    with pytest.raises(consultas.ErrorConsulta):
        consultar(consultas.ordenes, cliente_id=999)


# --- HTTP con token -------------------------------------------------------------------------

def test_mcp_por_http_exige_token():
    app = FastAPI(lifespan=lambda _: sesiones_mcp())
    montar(app, "token-de-prueba")
    cuerpo = {"jsonrpc": "2.0", "id": 1, "method": "ping"}
    cabeceras = {"Accept": "application/json, text/event-stream"}
    with TestClient(app) as c:
        assert c.post("/mcp", json=cuerpo, headers=cabeceras).status_code == 401
        r = c.post("/mcp", json=cuerpo, headers={**cabeceras, "Authorization": "Bearer otro"})
        assert r.status_code == 401
        r = c.post("/mcp", json=cuerpo, headers={**cabeceras, "Authorization": "Bearer token-de-prueba"})
        assert r.status_code != 401, r.text
