from datetime import UTC, date, datetime, timedelta

from app.database import SessionLocal
from app.models import RegistroBlusa
from tests.conftest import auth, crear_empleado, login

BLUSA = {"color": "  Rojo ", "talla": "M", "cantidadConfeccion": 5}


def empleada(client, admin, username="maria"):
    emp = crear_empleado(client, admin, username, pagoPorBlusa=2)
    return emp, auth(login(client, username, "secreta1"))


def insertar(usuario_id: int, cuando: datetime, color="azul") -> None:
    with SessionLocal() as db:
        db.add(RegistroBlusa(usuario_id=usuario_id, color=color, talla="S", cantidad_confeccion=1,
                             cantidad_mullos=0, cantidad_ataches=0, fecha_registro=cuando))
        db.commit()


def test_crear_registro(client, admin):
    emp, token = empleada(client, admin)
    antes = datetime.now(UTC)
    r = client.post("/api/registros", json={**BLUSA, "fechaRegistro": "2000-01-01T00:00:00Z",
                                            "empleadoId": 999}, headers=token)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["color"] == "Rojo"  # se aplica trim()
    assert body["cantidadConfeccion"] == 5
    assert body["cantidadMullos"] == 0 and body["cantidadAtaches"] == 0  # por defecto 0
    assert body["empleado"]["id"] == emp["id"]  # siempre el autenticado
    # La fecha la pone el servidor, se ignora la del cliente.
    assert datetime.fromisoformat(body["fechaRegistro"]) >= antes


def test_solo_mullos_o_ataches_sin_confeccion_es_valido(client, admin):
    _, token = empleada(client, admin)
    r = client.post("/api/registros", json={"color": "verde", "talla": "40",
                                            "cantidadMullos": 12, "cantidadAtaches": 10}, headers=token)
    assert r.status_code == 201


def test_validaciones(client, admin):
    _, token = empleada(client, admin)

    r = client.post("/api/registros", json={**BLUSA, "talla": "XXXL"}, headers=token)
    assert r.status_code == 400 and r.json() == {"message": "Talla inválida: XXXL"}

    r = client.post("/api/registros", json={**BLUSA, "cantidadConfeccion": 0}, headers=token)
    assert r.status_code == 400 and r.json() == {"message": "Debe registrar al menos una cantidad"}

    r = client.post("/api/registros", json={"color": " ", "talla": "M", "cantidadMullos": -1}, headers=token)
    assert r.status_code == 400
    msg = r.json()["message"]
    assert "color: no debe estar vacío" in msg
    assert "cantidadMullos: La cantidad de mullos no puede ser negativa" in msg


def test_permisos(client, admin):
    _, token = empleada(client, admin)
    assert client.post("/api/registros", json=BLUSA, headers=admin).status_code == 403
    assert client.get("/api/registros/mios", headers=admin).status_code == 403
    assert client.get("/api/registros", headers=token).status_code == 403
    assert client.get("/api/registros/getForDate", headers=token).status_code == 403
    assert client.get("/api/registros").status_code == 401


def test_mios_solo_los_propios(client, admin):
    _, maria = empleada(client, admin, "maria")
    _, ana = empleada(client, admin, "ana")
    client.post("/api/registros", json={**BLUSA, "color": "a"}, headers=maria)
    client.post("/api/registros", json={**BLUSA, "color": "b"}, headers=maria)
    client.post("/api/registros", json={**BLUSA, "color": "c"}, headers=ana)

    r = client.get("/api/registros/mios", headers=maria)
    assert [x["color"] for x in r.json()] == ["b", "a"]  # más reciente primero


def test_todos_limitado_a_30_dias(client, admin):
    emp, _ = empleada(client, admin)
    ahora = datetime.now(UTC)
    insertar(emp["id"], ahora - timedelta(days=31), "viejo")
    insertar(emp["id"], ahora - timedelta(days=29), "reciente")
    insertar(emp["id"], ahora - timedelta(hours=1), "hoy")

    r = client.get("/api/registros", headers=admin)
    assert [x["color"] for x in r.json()] == ["hoy", "reciente"]


def test_get_for_date(client, admin):
    maria, _ = empleada(client, admin, "maria")
    ana, _ = empleada(client, admin, "ana")
    hoy = datetime.combine(date.today(), datetime.min.time(), UTC)
    insertar(maria["id"], hoy + timedelta(hours=10), "hoy-maria")
    insertar(ana["id"], hoy + timedelta(hours=11), "hoy-ana")
    insertar(maria["id"], hoy - timedelta(days=40, hours=-1), "hace40")  # sin tope de 30 días
    insertar(maria["id"], hoy - timedelta(seconds=1), "ayer-ultimo-segundo")

    # Sin parámetros: solo hoy.
    r = client.get("/api/registros/getForDate", headers=admin)
    assert [x["color"] for x in r.json()] == ["hoy-ana", "hoy-maria"]

    # Rango explícito (ambos extremos incluidos) y filtro por empleada.
    desde = (date.today() - timedelta(days=40)).isoformat()
    r = client.get(f"/api/registros/getForDate?fechaInicio={desde}&fechaFin={date.today()}"
                   f"&empleadoId={maria['id']}", headers=admin)
    assert [x["color"] for x in r.json()] == ["hoy-maria", "ayer-ultimo-segundo", "hace40"]

    r = client.get("/api/registros/getForDate?empleadoId=9999", headers=admin)
    assert r.status_code == 404 and r.json() == {"message": "Empleado no encontrado"}

    r = client.get("/api/registros/getForDate?fechaInicio=10-11-2026", headers=admin)
    assert r.status_code == 400
    assert r.json() == {"message": "Valor inválido para el parámetro fechaInicio"}
