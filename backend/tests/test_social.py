"""Inicio de sesión con Google y Facebook. Nunca se llama a Google ni a Facebook: las claves
y las respuestas de la Graph API se simulan."""

import hashlib
import hmac
import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.models import IdentidadExterna, ProveedorSocial, Usuario
from app.security import social
from tests.conftest import auth, crear_empleado, login

CLIENT_ID = "123-test.apps.googleusercontent.com"


@pytest.fixture
def configurado(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "google_client_id", CLIENT_ID)
    monkeypatch.setattr(s, "facebook_app_id", "999")
    monkeypatch.setattr(s, "facebook_app_secret", "secreto-fb")
    return s


# --- Verificación de Google -----------------------------------------------------------------

@pytest.fixture
def google(monkeypatch, configurado):
    """Firma ID tokens con una clave RSA propia y hace que el verificador la use como si
    fuera la clave pública de Google."""
    clave = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    monkeypatch.setattr(social, "_google_jwks", lambda: SimpleNamespace(
        get_signing_key_from_jwt=lambda _: SimpleNamespace(key=clave.public_key())))

    def firmar(**cambios):
        ahora = int(time.time())
        datos = {"iss": "https://accounts.google.com", "aud": CLIENT_ID, "sub": "g-1",
                 "email": "maria.lopez@gmail.com", "email_verified": True, "name": "María López",
                 "iat": ahora, "exp": ahora + 3600, **cambios}
        return jwt.encode(datos, clave, algorithm="RS256")
    return firmar


def test_google_token_valido(google):
    perfil = social.verificar_google(google())
    assert perfil == social.PerfilExterno(ProveedorSocial.GOOGLE, "g-1", "María López",
                                          "maria.lopez@gmail.com")


def test_google_correo_sin_verificar_no_se_guarda(google):
    assert social.verificar_google(google(email_verified=False)).email is None


@pytest.mark.parametrize("cambios", [
    {"aud": "otra-app.apps.googleusercontent.com"},  # token emitido para otra aplicación
    {"iss": "https://evil.example.com"},
    {"exp": int(time.time()) - 3600},
])
def test_google_token_rechazado(google, cambios):
    with pytest.raises(social.TokenInvalido):
        social.verificar_google(google(**cambios))


def test_google_firma_de_otra_clave(google, monkeypatch):
    otra = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    token = jwt.encode({"iss": "accounts.google.com", "aud": CLIENT_ID, "sub": "x",
                        "iat": int(time.time()), "exp": int(time.time()) + 60}, otra, algorithm="RS256")
    with pytest.raises(social.TokenInvalido):
        social.verificar_google(token)


def test_google_sin_configurar(monkeypatch):
    monkeypatch.setattr(get_settings(), "google_client_id", "")
    with pytest.raises(social.ProveedorNoConfigurado):
        social.verificar_google("x")


# --- Verificación de Facebook ---------------------------------------------------------------

@pytest.fixture
def graph(monkeypatch, configurado):
    """Simula la Graph API: `respuestas` por ruta y registro de las llamadas."""
    falso = SimpleNamespace(llamadas=[], respuestas={
        "debug_token": {"data": {"is_valid": True, "app_id": "999", "user_id": "fb-7"}},
        "me": {"id": "fb-7", "name": "Ana Pérez", "email": "ana@example.com"},
    })

    def get(ruta, parametros):
        falso.llamadas.append((ruta, parametros))
        return falso.respuestas[ruta.split("/")[-1]]

    monkeypatch.setattr(social, "_graph_get", get)
    return falso


def test_facebook_token_valido(graph):
    perfil = social.verificar_facebook("tok")
    assert perfil == social.PerfilExterno(ProveedorSocial.FACEBOOK, "fb-7", "Ana Pérez", "ana@example.com")
    (ruta1, p1), (ruta2, p2) = graph.llamadas
    assert ruta1 == "v26.0/debug_token" and p1 == {"input_token": "tok", "access_token": "999|secreto-fb"}
    assert ruta2 == "v26.0/me"
    assert p2["appsecret_proof"] == hmac.new(b"secreto-fb", b"tok", hashlib.sha256).hexdigest()


@pytest.mark.parametrize("revision", [
    {"is_valid": False, "app_id": "999", "user_id": "fb-7"},
    {"is_valid": True, "app_id": "111", "user_id": "fb-7"},  # token de otra aplicación
])
def test_facebook_token_rechazado(graph, revision):
    graph.respuestas["debug_token"] = {"data": revision}
    with pytest.raises(social.TokenInvalido):
        social.verificar_facebook("tok")


def test_facebook_perfil_distinto_al_token(graph):
    graph.respuestas["me"] = {"id": "otro"}
    with pytest.raises(social.TokenInvalido):
        social.verificar_facebook("tok")


def test_facebook_sin_secreto(monkeypatch, configurado):
    monkeypatch.setattr(configurado, "facebook_app_secret", "")
    with pytest.raises(social.ProveedorNoConfigurado):
        social.verificar_facebook("tok")


# --- Endpoints ------------------------------------------------------------------------------

@pytest.fixture
def perfiles(monkeypatch):
    """Cada token de prueba es el id de un perfil de este diccionario."""
    tabla = {
        "maria": social.PerfilExterno(ProveedorSocial.GOOGLE, "g-1", "María López", "maria@gmail.com"),
        "maria-fb": social.PerfilExterno(ProveedorSocial.FACEBOOK, "fb-1", "María López", None),
        "otra-maria": social.PerfilExterno(ProveedorSocial.GOOGLE, "g-2", "María Ruiz", "maria@hotmail.com"),
        "jefa": social.PerfilExterno(ProveedorSocial.GOOGLE, "g-jefa", "La Jefa", "jefa@gmail.com"),
    }

    def verificar(proveedor, token):
        if token == "invalido":
            raise social.TokenInvalido("firma")
        if token == "caido":
            raise social.ProveedorNoDisponible("red")
        perfil = tabla[token]
        assert perfil.proveedor == proveedor
        return perfil

    monkeypatch.setattr(social, "verificar", verificar)
    return tabla


def social_login(client, token, proveedor="GOOGLE"):
    return client.post("/api/auth/social", json={"proveedor": proveedor, "token": token})


def usuario(username) -> Usuario:
    with SessionLocal() as db:
        return db.scalar(select(Usuario).where(Usuario.username == username))


def test_proveedores(client, monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "google_client_id", "")
    monkeypatch.setattr(s, "facebook_app_id", "")
    assert client.get("/api/auth/proveedores").json() == {"google": None, "facebook": None}

    monkeypatch.setattr(s, "google_client_id", CLIENT_ID)
    monkeypatch.setattr(s, "facebook_app_id", "999")
    monkeypatch.setattr(s, "facebook_app_secret", "secreto")
    assert client.get("/api/auth/proveedores").json() == {
        "google": {"clientId": CLIENT_ID},
        "facebook": {"appId": "999", "version": "v26.0"},
    }
    assert "secreto" not in client.get("/api/auth/proveedores").text


def test_cuenta_nueva_queda_pendiente_hasta_que_la_activen(client, admin, perfiles):
    r = social_login(client, "maria")
    assert r.status_code == 200, r.text
    assert r.json()["estado"] == "PENDIENTE" and r.json()["sesion"] is None

    nueva = usuario("maria")
    assert nueva.activo is False and nueva.role.value == "EMPLEADO"
    assert nueva.nombre_completo == "María López"
    # Tiene una contraseña aleatoria (hash BCrypt) que nadie conoce.
    assert nueva.password.startswith("$2")

    # Volver a entrar no crea otra cuenta.
    assert social_login(client, "maria").json()["estado"] == "PENDIENTE"
    with SessionLocal() as db:
        assert len(db.scalars(select(IdentidadExterna)).all()) == 1

    # La jefa la ve en Empleados y la activa.
    assert "maria" in [e["username"] for e in client.get("/api/empleados", headers=admin).json()]
    assert client.patch(f"/api/empleados/{nueva.id}/activar", headers=admin).status_code == 200

    r = social_login(client, "maria")
    body = r.json()
    assert body["estado"] == "AUTENTICADO"
    assert body["sesion"]["username"] == "maria" and body["sesion"]["role"] == "EMPLEADO"
    # El token sirve como el de un login normal.
    assert client.get("/api/registros/mios", headers=auth(body["sesion"]["token"])).status_code == 200


def test_username_no_se_repite(client, perfiles):
    social_login(client, "maria")
    social_login(client, "otra-maria")
    assert usuario("maria") is not None and usuario("maria2") is not None


def test_cuenta_dada_de_baja(client, admin, perfiles):
    social_login(client, "maria")
    id_ = usuario("maria").id
    client.patch(f"/api/empleados/{id_}/activar", headers=admin)
    assert client.delete(f"/api/empleados/{id_}", headers=admin).status_code == 204
    assert social_login(client, "maria").status_code == 403


@pytest.mark.parametrize("token, codigo", [("invalido", 401), ("caido", 502)])
def test_errores_de_verificacion(client, perfiles, token, codigo):
    r = social_login(client, token)
    assert r.status_code == codigo
    assert "Google" in r.json()["message"]


def test_proveedor_sin_configurar(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "google_client_id", "")
    r = social_login(client, "x")
    assert r.status_code == 503


def test_proveedor_invalido(client):
    assert social_login(client, "x", proveedor="GITHUB").status_code == 400


# --- Vincular cuentas -----------------------------------------------------------------------

def test_jefa_vincula_google_y_entra_con_el(client, admin, perfiles):
    assert client.get("/api/auth/vinculos", headers=admin).json() == []
    r = client.post("/api/auth/vinculos", json={"proveedor": "GOOGLE", "token": "jefa"}, headers=admin)
    assert r.status_code == 200, r.text
    assert [(v["proveedor"], v["email"]) for v in r.json()] == [("GOOGLE", "jefa@gmail.com")]

    body = social_login(client, "jefa").json()
    assert body["estado"] == "AUTENTICADO"
    assert (body["sesion"]["username"], body["sesion"]["role"]) == ("jefa", "ADMIN")

    # Vincular otra vez la misma cuenta no hace nada.
    again = client.post("/api/auth/vinculos", json={"proveedor": "GOOGLE", "token": "jefa"}, headers=admin)
    assert again.status_code == 200 and len(again.json()) == 1


def test_no_se_puede_vincular_cuenta_de_otro(client, admin, perfiles):
    crear_empleado(client, admin, "ana")
    ana = auth(login(client, "ana", "secreta1"))
    client.post("/api/auth/vinculos", json={"proveedor": "GOOGLE", "token": "jefa"}, headers=admin)
    r = client.post("/api/auth/vinculos", json={"proveedor": "GOOGLE", "token": "jefa"}, headers=ana)
    assert r.status_code == 409


def test_una_cuenta_por_proveedor_y_desvincular(client, admin, perfiles):
    client.post("/api/auth/vinculos", json={"proveedor": "GOOGLE", "token": "jefa"}, headers=admin)
    r = client.post("/api/auth/vinculos", json={"proveedor": "GOOGLE", "token": "maria"}, headers=admin)
    assert r.status_code == 409

    # Con Facebook sí puede tener otra.
    r = client.post("/api/auth/vinculos", json={"proveedor": "FACEBOOK", "token": "maria-fb"}, headers=admin)
    assert [v["proveedor"] for v in r.json()] == ["FACEBOOK", "GOOGLE"]

    assert client.delete("/api/auth/vinculos/GOOGLE", headers=admin).status_code == 204
    assert client.delete("/api/auth/vinculos/GOOGLE", headers=admin).status_code == 404
    # Ya no entra como la jefa: esa cuenta de Google es nueva otra vez (queda pendiente).
    assert social_login(client, "jefa").json()["estado"] == "PENDIENTE"


def test_vincular_requiere_sesion(client, perfiles):
    r = client.post("/api/auth/vinculos", json={"proveedor": "GOOGLE", "token": "jefa"})
    assert r.status_code == 401


def test_vincular_con_token_invalido_no_cierra_la_sesion(client, admin, perfiles):
    r = client.post("/api/auth/vinculos", json={"proveedor": "GOOGLE", "token": "invalido"}, headers=admin)
    assert r.status_code == 400  # un 401 haría que el frontend cerrara la sesión
