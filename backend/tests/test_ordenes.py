import time

from tests.conftest import auth, crear_empleado, login


def crear_cliente(client, admin, nombre="Tienda Rosa", telefono="0999999999") -> dict:
    r = client.post("/api/clientes", json={"nombre": nombre, "telefono": telefono}, headers=admin)
    assert r.status_code == 201, r.text
    return r.json()


def crear_orden(client, admin, cliente_id, items) -> dict:
    r = client.post("/api/ordenes", json={"clienteId": cliente_id, "items": items}, headers=admin)
    assert r.status_code == 201, r.text
    return r.json()


ITEMS = [
    {"color": "verde", "cantidad": 12, "precioUnitario": 3.50},
    {"color": "rojo", "cantidad": 3, "precioUnitario": "4.25"},
]


def test_solo_admin(client, admin):
    crear_empleado(client, admin)
    emp = auth(login(client, "maria", "secreta1"))
    for url in ["/api/clientes", "/api/ordenes", "/api/ordenes/1", "/api/ordenes/cliente/1"]:
        assert client.get(url, headers=emp).status_code == 403
        assert client.get(url).status_code == 401


def test_clientes(client, admin):
    assert crear_cliente(client, admin, "Zoila", None) == {"id": 1, "nombre": "Zoila", "telefono": None}
    crear_cliente(client, admin, "Ana")
    r = client.post("/api/clientes", json={"telefono": "1"}, headers=admin)
    assert r.status_code == 400 and r.json() == {"message": "nombre: no debe estar vacío"}

    nombres = [c["nombre"] for c in client.get("/api/clientes", headers=admin).json()]
    assert nombres == ["Ana", "Zoila"]  # orden alfabético


def test_crear_orden_calcula_subtotales_y_total(client, admin):
    cli = crear_cliente(client, admin)
    orden = crear_orden(client, admin, cli["id"], ITEMS)

    assert orden["cliente"] == cli
    assert orden["fechaCreacion"].endswith("Z")
    assert [(i["color"], i["cantidad"], i["precioUnitario"], i["subtotal"]) for i in orden["items"]] == [
        ("verde", 12, 3.5, 42.0),
        ("rojo", 3, 4.25, 12.75),
    ]
    assert orden["totalBlusas"] == 15
    assert orden["total"] == 54.75

    assert client.get(f"/api/ordenes/{orden['id']}", headers=admin).json() == orden


def test_validaciones_orden(client, admin):
    cli = crear_cliente(client, admin)

    r = client.post("/api/ordenes", json={"clienteId": cli["id"], "items": []}, headers=admin)
    assert r.status_code == 400
    assert r.json() == {"message": "items: La orden debe tener al menos un grupo de blusas"}

    r = client.post("/api/ordenes", json={"clienteId": cli["id"]}, headers=admin)
    assert r.json() == {"message": "items: La orden debe tener al menos un grupo de blusas"}

    r = client.post("/api/ordenes", json={"clienteId": cli["id"], "items": [
        {"color": "verde", "cantidad": 1, "precioUnitario": 1},
        {"color": "", "cantidad": 0, "precioUnitario": 0},
    ]}, headers=admin)
    assert r.status_code == 400
    msg = r.json()["message"]
    assert "items[1].color: no debe estar vacío" in msg
    assert "items[1].cantidad: La cantidad debe ser al menos 1" in msg
    assert "items[1].precioUnitario: El precio debe ser mayor a 0" in msg

    r = client.post("/api/ordenes", json={"clienteId": 9999, "items": ITEMS}, headers=admin)
    assert r.status_code == 404 and r.json() == {"message": "Cliente no encontrado"}


def test_listar_y_por_cliente(client, admin):
    a = crear_cliente(client, admin, "A")
    b = crear_cliente(client, admin, "B")
    o1 = crear_orden(client, admin, a["id"], ITEMS[:1])
    time.sleep(0.01)
    o2 = crear_orden(client, admin, b["id"], ITEMS)
    time.sleep(0.01)
    o3 = crear_orden(client, admin, a["id"], ITEMS[1:])

    ids = [o["id"] for o in client.get("/api/ordenes", headers=admin).json()]
    assert ids == [o3["id"], o2["id"], o1["id"]]  # más reciente primero

    ids = [o["id"] for o in client.get(f"/api/ordenes/cliente/{a['id']}", headers=admin).json()]
    assert ids == [o3["id"], o1["id"]]

    r = client.get("/api/ordenes/cliente/9999", headers=admin)
    assert r.status_code == 404 and r.json() == {"message": "Cliente no encontrado"}
    r = client.get("/api/ordenes/9999", headers=admin)
    assert r.status_code == 404 and r.json() == {"message": "Orden no encontrada"}
