"""Tests del asistente. Nunca se llama a una API de IA real: el proveedor y los clientes de
cada SDK se reemplazan por dobles que devuelven respuestas preparadas."""

import json
from datetime import timedelta
from types import SimpleNamespace

import pytest
from google.genai import types as gtypes

from app.config import get_settings
from app.database import SessionLocal
from app.schemas.asistente import MensajeChat
from app.services import asistente_service
from app.services.asistente_mcp import simplificar_esquema
from app.services.fechas import hoy_local
from app.services.ia import MODELOS_POR_DEFECTO, crear_proveedor
from app.services.ia.base import (
    RESPUESTA_RECHAZO,
    DefinicionHerramienta,
    DemasiadasVueltas,
    ErrorProveedor,
)
from app.services.ia.proveedor_anthropic import ProveedorAnthropic
from app.services.ia.proveedor_gemini import ProveedorGemini
from app.services.ia.proveedor_openai import ProveedorOpenAI
from tests.conftest import auth, crear_empleado, login
from tests.test_pagos import LUNES, contar_pagos, preparar_semana

HERRAMIENTAS_MCP = [
    "listar_empleados", "configuracion_pagos", "resumen_produccion", "pago_semanal",
    "pagos_registrados", "listar_clientes", "ordenes",
]
# Para probar los adaptadores sin depender del servidor MCP.
DEFINICIONES = [
    DefinicionHerramienta("listar_empleados", "Lista empleadas", {"type": "object", "properties": {}}),
    DefinicionHerramienta("pago_semanal", "Pago de una semana", {
        "type": "object",
        "properties": {"empleado_id": {"type": "integer"}, "semana_inicio": {"type": "string"}},
        "required": ["empleado_id", "semana_inicio"],
    }),
]


class ProveedorFalso:
    """Ejecuta un guion: ("tool", nombre, args) llama a la herramienta; ("texto", t) responde."""

    nombre, modelo = "falso", "falso-1"

    def __init__(self, *pasos, error: Exception | None = None):
        self.pasos, self.error = list(pasos), error
        self.llamadas: list[dict] = []
        self.resultados: list[tuple[str, bool]] = []

    def responder(self, *, sistema, mensajes, herramientas, ejecutar):
        self.llamadas.append({"sistema": sistema, "mensajes": mensajes, "herramientas": herramientas})
        if self.error:
            raise self.error
        for paso in self.pasos:
            if paso[0] == "tool":
                self.resultados.append(ejecutar(paso[1], paso[2]))
            else:
                return paso[1]
        return ""


@pytest.fixture
def usar(monkeypatch):
    def poner(proveedor):
        monkeypatch.setattr(asistente_service, "obtener_proveedor", lambda: proveedor)
        return proveedor
    return poner


def chat(client, headers, *mensajes):
    body = {"mensajes": [{"rol": r, "texto": t} for r, t in mensajes]}
    return client.post("/api/asistente/chat", json=body, headers=headers)


# --- Endpoint -------------------------------------------------------------------------------

def test_solo_admin(client, admin):
    crear_empleado(client, admin, "maria")
    empleada = auth(login(client, "maria", "secreta1"))
    assert chat(client, empleada, ("user", "hola")).status_code == 403
    assert chat(client, {}, ("user", "hola")).status_code == 401


def test_historial_debe_terminar_en_pregunta(client, admin, usar):
    proveedor = usar(ProveedorFalso(("texto", "x")))
    r = chat(client, admin, ("user", "hola"), ("assistant", "¡Hola!"))
    assert r.status_code == 400
    assert proveedor.llamadas == []


def test_respuesta_simple_con_historial(client, admin, usar):
    proveedor = usar(ProveedorFalso(("texto", "  Hola, ¿en qué te ayudo?  ")))
    r = chat(client, admin, ("user", "hola"), ("assistant", "Hola"), ("user", "¿estás?"))
    assert r.status_code == 200, r.text
    assert r.json() == {"respuesta": "Hola, ¿en qué te ayudo?", "acciones": []}
    llamada = proveedor.llamadas[0]
    assert [m.rol for m in llamada["mensajes"]] == ["user", "assistant", "user"]
    assert hoy_local().isoformat() in llamada["sistema"]
    # Las herramientas llegan del servidor MCP, con el esquema simplificado.
    herramientas = {h.nombre: h for h in llamada["herramientas"]}
    assert sorted(herramientas) == sorted(HERRAMIENTAS_MCP)
    assert herramientas["resumen_produccion"].parametros["properties"]["empleado_id"] == {
        "type": "integer", "description": "Opcional: id de la empleada (ver listar_empleados)"}


def test_consulta_de_pago_propone_confirmar_sin_registrar(client, admin, usar):
    maria, _ = preparar_semana(client, admin)
    proveedor = usar(ProveedorFalso(
        ("tool", "pago_semanal", {"empleado_id": maria["id"], "semana_inicio": LUNES.isoformat()}),
        ("texto", "A Maria se le deben $42.50."),
    ))
    r = chat(client, admin, ("user", "¿cuánto le debo a María esa semana?"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["respuesta"] == "A Maria se le deben $42.50."
    assert body["acciones"] == [{
        "tipo": "CONFIRMAR_PAGO", "empleadoId": maria["id"], "empleadoNombre": "Maria",
        "semanaInicio": "2026-11-02", "semanaFin": "2026-11-08", "montoTotal": 42.5,
    }]
    contenido, es_error = proveedor.resultados[0]
    assert not es_error and json.loads(contenido)["monto_total"] == 42.5
    assert contar_pagos() == 0  # el asistente nunca registra el pago

    # La ADMIN confirma con el endpoint normal de pagos.
    r = client.post("/api/pagos/calcular",
                    json={"empleadoId": maria["id"], "semanaInicio": "2026-11-02"}, headers=admin)
    assert r.status_code == 201, r.text
    assert contar_pagos() == 1


def test_error_de_herramienta_se_devuelve_al_modelo(client, admin, usar):
    proveedor = usar(ProveedorFalso(
        ("tool", "pago_semanal", {"empleado_id": 999, "semana_inicio": "2026-11-02"}),
        ("tool", "no_existe", {}),
        ("tool", "pago_semanal", {"empleado_id": "abc", "semana_inicio": "2026-11-02"}),
        ("texto", "No encontré a esa empleada."),
    ))
    r = chat(client, admin, ("user", "¿cuánto le debo a la empleada 999?"))
    assert r.status_code == 200, r.text
    assert r.json()["acciones"] == []
    assert all(es_error for _, es_error in proveedor.resultados)
    assert "999" in proveedor.resultados[0][0]


@pytest.mark.parametrize("tipo, codigo", [
    ("configuracion", 503), ("credenciales", 503), ("limite", 503), ("servicio", 502), ("conexion", 502),
])
def test_errores_del_proveedor(client, admin, usar, tipo, codigo):
    usar(ProveedorFalso(error=ErrorProveedor(tipo, "detalle interno")))
    r = chat(client, admin, ("user", "hola"))
    assert r.status_code == codigo
    assert "detalle interno" not in r.json()["message"]


def test_demasiadas_vueltas(client, admin, usar):
    usar(ProveedorFalso(error=DemasiadasVueltas()))
    r = chat(client, admin, ("user", "hola"))
    assert r.status_code == 200
    assert "específica" in r.json()["respuesta"]


# --- Elección del proveedor -----------------------------------------------------------------

def ajustes(**cambios):
    return get_settings().model_copy(update=cambios)


@pytest.mark.parametrize("nombre, clase, clave", [
    ("openai", ProveedorOpenAI, "openai_api_key"),
    ("gemini", ProveedorGemini, "gemini_api_key"),
    ("anthropic", ProveedorAnthropic, "anthropic_api_key"),
])
def test_crear_proveedor(nombre, clase, clave):
    proveedor = crear_proveedor(ajustes(asistente_proveedor=nombre, **{clave: "clave"}))
    assert isinstance(proveedor, clase)
    assert proveedor.modelo == MODELOS_POR_DEFECTO[nombre]

    proveedor = crear_proveedor(ajustes(asistente_proveedor=nombre, asistente_modelo=" otro ", **{clave: "clave"}))
    assert proveedor.modelo == "otro"

    with pytest.raises(ErrorProveedor) as e:
        crear_proveedor(ajustes(asistente_proveedor=nombre, **{clave: " "}))
    assert e.value.tipo == "configuracion"


def test_openai_es_el_proveedor_por_defecto():
    assert type(get_settings()).model_fields["asistente_proveedor"].default == "openai"


# --- Ciclo de herramientas de cada adaptador (con el cliente del SDK falseado) -------------

MENSAJES = [MensajeChat(rol="user", texto="¿cuánto le debo a Ana?")]


class Registro:
    def __init__(self):
        self.llamadas = []

    def __call__(self, nombre, args):
        self.llamadas.append((nombre, args))
        return f"resultado de {nombre}", False


def responder(proveedor, ejecutar):
    return proveedor.responder(sistema="sistema", mensajes=MENSAJES, herramientas=DEFINICIONES,
                               ejecutar=ejecutar)


def cliente_falso(*respuestas):
    peticiones = []

    def crear(**kwargs):
        peticiones.append({**kwargs, **{k: list(v) for k, v in kwargs.items() if isinstance(v, list)}})
        return respuestas[len(peticiones) - 1]

    return crear, peticiones


def test_ciclo_openai():
    llamada = SimpleNamespace(type="function_call", call_id="call_1", name="pago_semanal",
                              arguments='{"empleado_id": 2, "semana_inicio": "2026-11-02"}')
    crear, peticiones = cliente_falso(
        SimpleNamespace(output=[llamada], output_text=""),
        SimpleNamespace(output=[SimpleNamespace(type="message", content=[])], output_text="Le debes $10."),
    )
    proveedor = ProveedorOpenAI("clave", "gpt-x")
    proveedor._cliente = SimpleNamespace(responses=SimpleNamespace(create=crear))
    ejecutar = Registro()

    assert responder(proveedor, ejecutar) == "Le debes $10."
    assert ejecutar.llamadas == [("pago_semanal", {"empleado_id": 2, "semana_inicio": "2026-11-02"})]
    primera = peticiones[0]
    assert primera["model"] == "gpt-x" and primera["instructions"] == "sistema"
    assert {t["name"] for t in primera["tools"]} == {h.nombre for h in DEFINICIONES}
    assert peticiones[1]["input"][-2:] == [
        llamada, {"type": "function_call_output", "call_id": "call_1", "output": "resultado de pago_semanal"},
    ]


def test_openai_rechazo():
    rechazo = SimpleNamespace(type="message", content=[SimpleNamespace(type="refusal", refusal="no")])
    crear, _ = cliente_falso(SimpleNamespace(output=[rechazo], output_text=""))
    proveedor = ProveedorOpenAI("clave", "gpt-x")
    proveedor._cliente = SimpleNamespace(responses=SimpleNamespace(create=crear))
    assert responder(proveedor, Registro()) == RESPUESTA_RECHAZO


def gemini_respuesta(*partes: gtypes.Part) -> gtypes.GenerateContentResponse:
    contenido = gtypes.Content(role="model", parts=list(partes))
    return gtypes.GenerateContentResponse(candidates=[gtypes.Candidate(content=contenido)])


def test_ciclo_gemini():
    llamada = gtypes.Part(function_call=gtypes.FunctionCall(
        id="fc_1", name="pago_semanal", args={"empleado_id": 2.0, "semana_inicio": "2026-11-02"}))
    crear, peticiones = cliente_falso(
        gemini_respuesta(llamada),
        gemini_respuesta(gtypes.Part.from_text(text="Le debes $10.")),
    )
    proveedor = ProveedorGemini("clave", "gemini-x")
    proveedor._cliente = SimpleNamespace(models=SimpleNamespace(generate_content=crear))
    ejecutar = Registro()

    assert responder(proveedor, ejecutar) == "Le debes $10."
    assert ejecutar.llamadas == [("pago_semanal", {"empleado_id": 2.0, "semana_inicio": "2026-11-02"})]
    config = peticiones[0]["config"]
    assert config.system_instruction == "sistema"
    assert config.automatic_function_calling.disable is True
    contenidos = peticiones[1]["contents"]
    assert [c.role for c in contenidos] == ["user", "model", "user"]
    respuesta = contenidos[-1].parts[0].function_response
    assert (respuesta.id, respuesta.name, respuesta.response) == (
        "fc_1", "pago_semanal", {"output": "resultado de pago_semanal"})


def test_gemini_bloqueado():
    crear, _ = cliente_falso(gtypes.GenerateContentResponse(candidates=[]))
    proveedor = ProveedorGemini("clave", "gemini-x")
    proveedor._cliente = SimpleNamespace(models=SimpleNamespace(generate_content=crear))
    assert responder(proveedor, Registro()) == RESPUESTA_RECHAZO


def anthropic_respuesta(stop_reason, *bloques):
    return SimpleNamespace(stop_reason=stop_reason, content=list(bloques))


@pytest.mark.parametrize("modelo, usa_beta", [("claude-opus-5-5", True), ("claude-haiku-4-5", False)])
def test_ciclo_anthropic(modelo, usa_beta):
    bloque = SimpleNamespace(type="tool_use", id="tu_1", name="listar_empleados", input={})
    crear, peticiones = cliente_falso(
        anthropic_respuesta("tool_use", bloque),
        anthropic_respuesta("end_turn", SimpleNamespace(type="text", text="Hay 2 empleadas.")),
    )
    proveedor = ProveedorAnthropic("clave", modelo)
    mensajes = SimpleNamespace(create=crear)
    proveedor._cliente = SimpleNamespace(messages=mensajes, beta=SimpleNamespace(messages=mensajes))
    ejecutar = Registro()

    assert responder(proveedor, ejecutar) == "Hay 2 empleadas."
    assert ejecutar.llamadas == [("listar_empleados", {})]
    assert ("fallbacks" in peticiones[0]) is usa_beta
    assert peticiones[1]["messages"][-1] == {"role": "user", "content": [{
        "type": "tool_result", "tool_use_id": "tu_1", "content": "resultado de listar_empleados",
        "is_error": False,
    }]}


def test_anthropic_rechazo():
    crear, _ = cliente_falso(anthropic_respuesta("refusal"))
    proveedor = ProveedorAnthropic("clave", "claude-opus-5-5")
    proveedor._cliente = SimpleNamespace(beta=SimpleNamespace(messages=SimpleNamespace(create=crear)))
    assert responder(proveedor, Registro()) == RESPUESTA_RECHAZO


def test_tope_de_vueltas():
    llamada = SimpleNamespace(type="function_call", call_id="c", name="listar_empleados", arguments="{}")
    proveedor = ProveedorOpenAI("clave", "gpt-x")
    proveedor._cliente = SimpleNamespace(responses=SimpleNamespace(
        create=lambda **_: SimpleNamespace(output=[llamada], output_text="")))
    with pytest.raises(DemasiadasVueltas):
        responder(proveedor, Registro())


# --- Esquemas ------------------------------------------------------------------------------

def test_simplificar_esquema():
    esquema = {
        "title": "args", "type": "object", "required": ["a"],
        "properties": {
            "a": {"title": "A", "type": "string"},
            "title": {"anyOf": [{"type": "integer"}, {"type": "null"}], "default": None, "title": "T"},
            "c": {"anyOf": [{"type": "integer"}, {"type": "string"}]},
        },
    }
    assert simplificar_esquema(esquema) == {
        "type": "object", "required": ["a"],
        "properties": {
            "a": {"type": "string"},
            "title": {"type": "integer"},
            "c": {"anyOf": [{"type": "integer"}, {"type": "string"}]},
        },
    }
