from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.database import SessionLocal
from app.models import RegistroBlusa, Role, Usuario
from tests.conftest import auth, login

NUEVO = {"username": "maria", "password": "secreta1", "nombreCompleto": "María López"}


def crear(client, admin, **extra) -> dict:
    r = client.post("/api/empleados", json={**NUEVO, **extra}, headers=admin)
    assert r.status_code == 201, r.text
    return r.json()


def id_admin() -> int:
    with SessionLocal() as db:
        return db.scalar(select(Usuario.id).where(Usuario.role == Role.ADMIN))


def test_solo_admin(client, admin):
    assert client.get("/api/empleados").status_code == 401
    crear(client, admin)
    emp = auth(login(client, "maria", "secreta1"))
    assert client.get("/api/empleados", headers=emp).status_code == 403


def test_crear_activo_y_pago_por_defecto_cero(client, admin):
    body = crear(client, admin)
    assert body == {"id": body["id"], "username": "maria", "nombreCompleto": "María López",
                    "activo": True, "pagoPorBlusa": 0.0}
    assert login(client, "maria", "secreta1")  # puede entrar de inmediato


def test_crear_con_pago_y_validaciones(client, admin):
    assert crear(client, admin, pagoPorBlusa=3.5)["pagoPorBlusa"] == 3.5

    r = client.post("/api/empleados", json={**NUEVO, "username": "otra", "pagoPorBlusa": -1}, headers=admin)
    assert r.status_code == 400
    assert r.json() == {"message": "pagoPorBlusa: El pago por blusa no puede ser negativo"}

    r = client.post("/api/empleados", json=NUEVO, headers=admin)
    assert r.status_code == 409
    assert r.json() == {"message": "El username ya está en uso"}


def test_listar_incluye_pendientes_y_excluye_eliminados_y_admin(client, admin):
    maria = crear(client, admin)
    client.post("/api/auth/register", json={"username": "pend", "password": "secreta1", "nombreCompleto": "P"})
    otra = crear(client, admin, username="otra")
    client.delete(f"/api/empleados/{otra['id']}", headers=admin)

    lista = client.get("/api/empleados", headers=admin).json()
    assert {e["username"]: e["activo"] for e in lista} == {"maria": True, "pend": False}
    assert lista[0]["id"] == maria["id"]


def test_activar(client, admin):
    client.post("/api/auth/register", json={"username": "pend", "password": "secreta1", "nombreCompleto": "P"})
    pend = client.get("/api/empleados", headers=admin).json()[0]
    r = client.patch(f"/api/empleados/{pend['id']}/activar", headers=admin)
    assert r.status_code == 200 and r.json()["activo"] is True
    assert login(client, "pend", "secreta1")


def test_actualizar_pago(client, admin):
    emp = crear(client, admin)
    r = client.patch(f"/api/empleados/{emp['id']}/pago", json={"pagoPorBlusa": "4.25"}, headers=admin)
    assert r.status_code == 200 and r.json()["pagoPorBlusa"] == 4.25

    r = client.patch(f"/api/empleados/{emp['id']}/pago", json={"pagoPorBlusa": 0}, headers=admin)
    assert r.status_code == 400
    assert r.json() == {"message": "pagoPorBlusa: La tarifa por blusa debe ser mayor a 0"}


def test_cambiar_password_incluye_admin(client, admin):
    emp = crear(client, admin)
    r = client.patch(f"/api/empleados/{emp['id']}/password", json={"password": "nueva123"}, headers=admin)
    assert r.status_code == 204
    assert login(client, "maria", "nueva123")

    r = client.patch(f"/api/empleados/{id_admin()}/password", json={"password": "jefa9999"}, headers=admin)
    assert r.status_code == 204
    assert login(client, "jefa", "jefa9999")

    r = client.patch("/api/empleados/9999/password", json={"password": "nueva123"}, headers=admin)
    assert r.status_code == 404 and r.json() == {"message": "Usuario no encontrado"}


def test_eliminar_soft_delete(client, admin):
    emp = crear(client, admin)
    token = auth(login(client, "maria", "secreta1"))

    assert client.delete(f"/api/empleados/{emp['id']}", headers=admin).status_code == 204
    with SessionLocal() as db:
        assert db.get(Usuario, emp["id"]).eliminado is True  # la fila sigue existiendo

    # Login rechazado y el token anterior deja de servir.
    r = client.post("/api/auth/login", json={"username": "maria", "password": "secreta1"})
    assert r.status_code == 401
    assert client.get("/api/empleados", headers=token).status_code == 401

    # Activar / pago / eliminar / password sobre un eliminado → 404.
    for metodo, url, body in [
        ("PATCH", f"/api/empleados/{emp['id']}/activar", None),
        ("PATCH", f"/api/empleados/{emp['id']}/pago", {"pagoPorBlusa": 1}),
        ("DELETE", f"/api/empleados/{emp['id']}", None),
        ("PATCH", f"/api/empleados/{emp['id']}/password", {"password": "nueva123"}),
    ]:
        assert client.request(metodo, url, json=body, headers=admin).status_code == 404


def test_no_se_puede_eliminar_admin(client, admin):
    r = client.delete(f"/api/empleados/{id_admin()}", headers=admin)
    assert r.status_code == 404 and r.json() == {"message": "Empleado no encontrado"}


def test_registros_de_empleado(client, admin):
    emp = crear(client, admin, pagoPorBlusa=2)
    ahora = datetime.now(UTC)
    with SessionLocal() as db:
        for i, color in enumerate(["rojo", "azul"]):
            db.add(RegistroBlusa(usuario_id=emp["id"], color=color, talla="M",
                                 cantidad_confeccion=i + 1, cantidad_mullos=0, cantidad_ataches=3,
                                 fecha_registro=ahora - timedelta(days=1 - i)))
        db.commit()

    r = client.get(f"/api/empleados/{emp['id']}/registros", headers=admin)
    assert r.status_code == 200
    regs = r.json()
    assert [x["color"] for x in regs] == ["azul", "rojo"]  # más reciente primero
    assert regs[0]["cantidadConfeccion"] == 2 and regs[0]["cantidadAtaches"] == 3
    assert regs[0]["empleado"]["username"] == "maria"
    assert regs[0]["empleado"]["pagoPorBlusa"] == 2.0
    assert regs[0]["fechaRegistro"].endswith("Z")

    r = client.get("/api/empleados/9999/registros", headers=admin)
    assert r.status_code == 404

    r = client.get("/api/empleados/abc/registros", headers=admin)
    assert r.status_code == 400
    assert r.json() == {"message": "Valor inválido para el parámetro id"}
