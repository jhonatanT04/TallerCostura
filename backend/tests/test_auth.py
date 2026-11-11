import time

import bcrypt
import jwt
from sqlalchemy import select, update

from app.database import SessionLocal
from app.models import Role, Usuario
from app.security.deps import AdminUser
from app.main import app
from tests.conftest import login


@app.get("/api/_test/admin")
def _solo_admin(usuario: AdminUser) -> dict:
    return {"username": usuario.username}


def test_ping(client):
    r = client.get("/api/ping")
    assert r.status_code == 200
    assert r.text == "pong"


def test_seeder_crea_admin_y_puede_loguearse(client):
    r = client.post("/api/auth/login", json={"username": "jefa", "password": "jefa1234"})
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "ADMIN"
    assert body["nombreCompleto"] == "Jefa"
    claims = jwt.decode(body["token"], options={"verify_signature": False})
    assert claims["sub"] == "jefa" and claims["role"] == "ADMIN"


def test_login_usuario_inexistente_404(client):
    r = client.post("/api/auth/login", json={"username": "nadie", "password": "x"})
    assert r.status_code == 404
    assert r.json() == {"message": "Usuario no encontrado: nadie"}


def test_login_password_incorrecta_401(client):
    r = client.post("/api/auth/login", json={"username": "jefa", "password": "mala"})
    assert r.status_code == 401
    assert r.json() == {"message": "Credenciales inválidas"}


def test_register_queda_inactivo_hasta_activacion(client):
    datos = {"username": "ana", "password": "secreta1", "nombreCompleto": "Ana P"}
    r = client.post("/api/auth/register", json=datos)
    assert r.status_code == 201
    assert r.content == b""

    # Pendiente de activación: 401 genérico, igual que una contraseña incorrecta.
    r = client.post("/api/auth/login", json={"username": "ana", "password": "secreta1"})
    assert r.status_code == 401

    with SessionLocal() as db:
        db.execute(update(Usuario).where(Usuario.username == "ana").values(activo=True))
        db.commit()
    assert login(client, "ana", "secreta1")


def test_register_duplicado_409(client):
    r = client.post(
        "/api/auth/register",
        json={"username": "jefa", "password": "secreta1", "nombreCompleto": "X"},
    )
    assert r.status_code == 409
    assert r.json() == {"message": "Ya existe un usuario con el username: jefa"}


def test_register_validaciones_400(client):
    r = client.post(
        "/api/auth/register", json={"username": "  ", "password": "123"}
    )
    assert r.status_code == 400
    msg = r.json()["message"]
    assert "username: no debe estar vacío" in msg
    assert "password: La contraseña debe tener al menos 6 caracteres" in msg
    assert "nombreCompleto: no debe estar vacío" in msg


def test_hash_de_spring_es_compatible(client):
    # Spring BCryptPasswordEncoder genera hashes con prefijo $2a$.
    hash_spring = bcrypt.hashpw(b"desdeJava", bcrypt.gensalt(10, prefix=b"2a")).decode()
    assert hash_spring.startswith("$2a$10$")
    with SessionLocal() as db:
        db.add(Usuario(username="java", password=hash_spring, nombre_completo="J",
                       role=Role.EMPLEADO, activo=True))
        db.commit()
    assert login(client, "java", "desdeJava")


def test_rutas_protegidas(client):
    assert client.get("/api/_test/admin").status_code == 401
    assert client.get("/api/_test/admin", headers={"Authorization": "Bearer basura"}).status_code == 401

    admin = login(client, "jefa", "jefa1234")
    r = client.get("/api/_test/admin", headers={"Authorization": f"Bearer {admin}"})
    assert r.status_code == 200

    client.post("/api/auth/register", json={"username": "emp", "password": "secreta1", "nombreCompleto": "E"})
    with SessionLocal() as db:
        db.execute(update(Usuario).where(Usuario.username == "emp").values(activo=True))
        db.commit()
    emp = login(client, "emp", "secreta1")
    r = client.get("/api/_test/admin", headers={"Authorization": f"Bearer {emp}"})
    assert r.status_code == 403

    # Al eliminarlo (soft delete) su token deja de servir de inmediato.
    with SessionLocal() as db:
        db.execute(update(Usuario).where(Usuario.username == "emp").values(eliminado=True))
        db.commit()
    r = client.get("/api/_test/admin", headers={"Authorization": f"Bearer {emp}"})
    assert r.status_code == 401


def test_token_expirado(client):
    from app.config import get_settings
    secret = get_settings().jwt_secret_key.encode()
    vencido = jwt.encode({"sub": "jefa", "role": "ADMIN", "iat": 1, "exp": int(time.time()) - 10},
                         secret, algorithm="HS256")
    r = client.get("/api/_test/admin", headers={"Authorization": f"Bearer {vencido}"})
    assert r.status_code == 401
    assert r.json() == {"message": "El token ha expirado"}
