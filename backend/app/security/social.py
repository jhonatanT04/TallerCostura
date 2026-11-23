"""Verificación de los tokens que entregan Google y Facebook al iniciar sesión en el navegador.

El navegador obtiene el token con el SDK oficial de cada proveedor y lo manda al backend.
Aquí se comprueba que sea auténtico y emitido para ESTA aplicación; solo entonces se confía
en el id de la cuenta. Nunca se usa un dato que mande el navegador sin verificar.
"""

import hashlib
import hmac
import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt

from app.config import get_settings
from app.models import ProveedorSocial

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_EMISORES = {"accounts.google.com", "https://accounts.google.com"}
FACEBOOK_GRAPH_URL = "https://graph.facebook.com"
TIMEOUT_SEGUNDOS = 10


@dataclass(frozen=True)
class PerfilExterno:
    proveedor: ProveedorSocial
    sujeto: str  # id estable de la cuenta en el proveedor
    nombre: str | None
    email: str | None


class ProveedorNoConfigurado(Exception):
    pass


class TokenInvalido(Exception):
    pass


class ProveedorNoDisponible(Exception):
    """No se pudo contactar al proveedor (red, caída del servicio)."""


def verificar(proveedor: ProveedorSocial, token: str) -> PerfilExterno:
    if proveedor == ProveedorSocial.GOOGLE:
        return verificar_google(token)
    return verificar_facebook(token)


# --- Google ---------------------------------------------------------------------------------

def verificar_google(id_token: str) -> PerfilExterno:
    """Valida el ID token (JWT) de Google Identity Services: firma con las claves públicas
    de Google, audiencia = nuestro client id, emisor de Google y que no haya vencido."""
    client_id = get_settings().google_client_id.strip()
    if not client_id:
        raise ProveedorNoConfigurado("GOOGLE")

    try:
        clave = _google_jwks().get_signing_key_from_jwt(id_token)
    except jwt.PyJWKClientConnectionError as e:
        raise ProveedorNoDisponible("No se pudo contactar a Google") from e
    except jwt.PyJWTError as e:
        raise TokenInvalido(str(e)) from e

    try:
        datos = jwt.decode(
            id_token,
            clave.key,
            algorithms=["RS256"],
            audience=client_id,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
            leeway=30,
        )
    except jwt.PyJWTError as e:
        raise TokenInvalido(str(e)) from e
    if datos.get("iss") not in GOOGLE_EMISORES:
        raise TokenInvalido("Emisor inválido")

    return PerfilExterno(
        proveedor=ProveedorSocial.GOOGLE,
        sujeto=str(datos["sub"]),
        nombre=datos.get("name"),
        email=datos.get("email") if datos.get("email_verified") else None,
    )


@lru_cache
def _google_jwks() -> jwt.PyJWKClient:
    # Guarda en caché las claves públicas de Google; las vuelve a pedir si rotan.
    return jwt.PyJWKClient(GOOGLE_JWKS_URL, cache_keys=True, timeout=TIMEOUT_SEGUNDOS)


# --- Facebook -------------------------------------------------------------------------------

def verificar_facebook(access_token: str) -> PerfilExterno:
    """Valida el access token del SDK de Facebook con `debug_token` (que sea válido y de
    NUESTRA app, no de otra) y luego lee el perfil con ese token."""
    s = get_settings()
    app_id, secreto = s.facebook_app_id.strip(), s.facebook_app_secret.strip()
    if not app_id or not secreto:
        raise ProveedorNoConfigurado("FACEBOOK")
    version = s.facebook_graph_version.strip()

    revision = _graph_get(
        f"{version}/debug_token",
        {"input_token": access_token, "access_token": f"{app_id}|{secreto}"},
    ).get("data") or {}
    if not revision.get("is_valid"):
        raise TokenInvalido("Token de Facebook inválido o vencido")
    if str(revision.get("app_id")) != app_id:
        # Un token válido, pero emitido para otra aplicación: no sirve para entrar aquí.
        raise TokenInvalido("El token de Facebook es de otra aplicación")
    usuario_id = str(revision.get("user_id") or "")

    # appsecret_proof: Facebook rechaza la llamada si el token no se usa junto a nuestro secreto.
    prueba = hmac.new(secreto.encode(), access_token.encode(), hashlib.sha256).hexdigest()
    perfil = _graph_get(
        f"{version}/me",
        {"fields": "id,name,email", "access_token": access_token, "appsecret_proof": prueba},
    )
    if not usuario_id or str(perfil.get("id")) != usuario_id:
        raise TokenInvalido("El perfil de Facebook no coincide con el token")

    return PerfilExterno(
        proveedor=ProveedorSocial.FACEBOOK,
        sujeto=usuario_id,
        nombre=perfil.get("name"),
        email=perfil.get("email"),
    )


def _graph_get(ruta: str, parametros: dict[str, str]) -> dict[str, Any]:
    url = f"{FACEBOOK_GRAPH_URL}/{ruta}?{urllib.parse.urlencode(parametros)}"
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT_SEGUNDOS) as respuesta:
            return json.load(respuesta)
    except urllib.error.HTTPError as e:
        # Errores 4xx de la Graph API: token inválido, vencido o revocado.
        if 400 <= e.code < 500:
            raise TokenInvalido(f"Facebook respondió {e.code}") from e
        raise ProveedorNoDisponible(f"Facebook respondió {e.code}") from e
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        raise ProveedorNoDisponible("No se pudo contactar a Facebook") from e
