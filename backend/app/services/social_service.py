"""Inicio de sesión con Google y Facebook, y vínculo de esas cuentas con un usuario.

- Una cuenta externa conocida entra como su usuario (si está activo).
- Una cuenta externa nueva crea una EMPLEADA inactiva, igual que el auto-registro: la ADMIN
  la activa desde Empleados. No se vincula por correo con cuentas existentes, porque los
  usuarios no tienen correo; para eso está "vincular" desde una sesión iniciada.
"""

import re
import secrets
import unicodedata
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import IdentidadExterna, ProveedorSocial, Role, Usuario
from app.schemas.auth import (
    ConfigFacebook,
    ConfigGoogle,
    LoginResponse,
    ProveedoresResponse,
    SocialLoginResponse,
    VinculoDTO,
)
from app.config import get_settings
from app.security import social
from app.security.jwt_service import generate_token
from app.security.passwords import hash_password

NOMBRES = {ProveedorSocial.GOOGLE: "Google", ProveedorSocial.FACEBOOK: "Facebook"}
MENSAJE_PENDIENTE = (
    "Tu cuenta está pendiente de aprobación por la administradora. "
    "Podrás entrar cuando la active."
)


def proveedores() -> ProveedoresResponse:
    s = get_settings()
    return ProveedoresResponse(
        google=ConfigGoogle(client_id=s.google_client_id.strip()) if s.google_client_id.strip() else None,
        facebook=(
            ConfigFacebook(app_id=s.facebook_app_id.strip(), version=s.facebook_graph_version.strip())
            if s.facebook_app_id.strip() and s.facebook_app_secret.strip()
            else None
        ),
    )


def iniciar_sesion(db: Session, proveedor: ProveedorSocial, token: str) -> SocialLoginResponse:
    perfil = _verificar(proveedor, token)

    identidad = _buscar(db, perfil)
    if identidad is None:
        identidad = _crear_cuenta_pendiente(db, perfil)
    elif perfil.email and identidad.email != perfil.email:
        identidad.email = perfil.email
        db.commit()

    usuario = identidad.usuario
    if usuario.eliminado:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Esta cuenta fue dada de baja")
    if not usuario.activo:
        return SocialLoginResponse(estado="PENDIENTE", mensaje=MENSAJE_PENDIENTE)
    return SocialLoginResponse(
        estado="AUTENTICADO",
        sesion=LoginResponse(
            token=generate_token(usuario),
            role=usuario.role,
            username=usuario.username,
            nombre_completo=usuario.nombre_completo,
        ),
    )


def vinculos(db: Session, usuario: Usuario) -> list[VinculoDTO]:
    identidades = db.scalars(
        select(IdentidadExterna)
        .where(IdentidadExterna.usuario_id == usuario.id)
        .order_by(IdentidadExterna.proveedor)
    )
    return [
        VinculoDTO(proveedor=i.proveedor, email=i.email, vinculado_en=i.creado_en)
        for i in identidades
    ]


def vincular(
    db: Session, usuario: Usuario, proveedor: ProveedorSocial, token: str
) -> list[VinculoDTO]:
    """Vincula una cuenta de Google/Facebook al usuario con sesión iniciada, para que después
    pueda entrar con ella (así la jefa y las empleadas existentes usan Google o Facebook)."""
    perfil = _verificar(proveedor, token, codigo_invalido=status.HTTP_400_BAD_REQUEST)
    nombre = NOMBRES[proveedor]

    existente = _buscar(db, perfil)
    if existente is not None:
        if existente.usuario_id == usuario.id:
            return vinculos(db, usuario)  # ya estaba vinculada: no hay nada que hacer
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Esa cuenta de {nombre} ya está vinculada a otro usuario"
        )
    otra = db.scalar(
        select(IdentidadExterna.id).where(
            IdentidadExterna.usuario_id == usuario.id, IdentidadExterna.proveedor == proveedor
        )
    )
    if otra is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Ya tienes otra cuenta de {nombre} vinculada; desvincúlala primero",
        )

    db.add(_identidad(usuario, perfil))
    try:
        db.commit()
    except IntegrityError as e:  # otra petición la vinculó al mismo tiempo
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Esa cuenta de {nombre} ya está vinculada"
        ) from e
    return vinculos(db, usuario)


def desvincular(db: Session, usuario: Usuario, proveedor: ProveedorSocial) -> None:
    identidad = db.scalar(
        select(IdentidadExterna).where(
            IdentidadExterna.usuario_id == usuario.id, IdentidadExterna.proveedor == proveedor
        )
    )
    if identidad is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"No tienes una cuenta de {NOMBRES[proveedor]} vinculada"
        )
    db.delete(identidad)
    db.commit()


# --- Auxiliares -----------------------------------------------------------------------------

def _verificar(
    proveedor: ProveedorSocial, token: str, codigo_invalido: int = status.HTTP_401_UNAUTHORIZED
) -> social.PerfilExterno:
    """Al vincular, un token externo inválido es un 400: un 401 haría que el frontend
    cerrara la sesión del usuario, que sí es válida."""
    nombre = NOMBRES[proveedor]
    try:
        return social.verificar(proveedor, token)
    except social.ProveedorNoConfigurado as e:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, f"El inicio de sesión con {nombre} no está habilitado"
        ) from e
    except social.TokenInvalido as e:
        raise HTTPException(codigo_invalido, f"No se pudo verificar tu cuenta de {nombre}") from e
    except social.ProveedorNoDisponible as e:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, f"No se pudo contactar a {nombre}, intenta de nuevo"
        ) from e


def _buscar(db: Session, perfil: social.PerfilExterno) -> IdentidadExterna | None:
    return db.scalar(
        select(IdentidadExterna)
        .options(joinedload(IdentidadExterna.usuario))
        .where(
            IdentidadExterna.proveedor == perfil.proveedor,
            IdentidadExterna.sujeto == perfil.sujeto,
        )
    )


def _crear_cuenta_pendiente(db: Session, perfil: social.PerfilExterno) -> IdentidadExterna:
    usuario = Usuario(
        username=_username_libre(db, perfil),
        # Contraseña aleatoria que nadie conoce: entra con Google/Facebook. Si alguna vez
        # necesita contraseña, la ADMIN se la asigna desde Empleados.
        password=hash_password(secrets.token_urlsafe(32)),
        nombre_completo=(perfil.nombre or "").strip() or f"Usuario de {NOMBRES[perfil.proveedor]}",
        role=Role.EMPLEADO,
        activo=False,  # pendiente hasta que la ADMIN la active
        eliminado=False,
    )
    identidad = _identidad(usuario, perfil)
    db.add_all([usuario, identidad])
    try:
        db.commit()
    except IntegrityError:
        # Dos inicios de sesión simultáneos con la misma cuenta: se usa la que ganó.
        db.rollback()
        existente = _buscar(db, perfil)
        if existente is None:
            raise
        return existente
    return identidad


def _identidad(usuario: Usuario, perfil: social.PerfilExterno) -> IdentidadExterna:
    return IdentidadExterna(
        usuario=usuario,
        proveedor=perfil.proveedor,
        sujeto=perfil.sujeto,
        email=perfil.email,
        creado_en=datetime.now(UTC),
    )


def _username_libre(db: Session, perfil: social.PerfilExterno) -> str:
    """Usuario legible a partir del correo o del nombre (p. ej. "maria.lopez"), con un
    número al final si ya existe."""
    base = (perfil.email or "").split("@")[0] or (perfil.nombre or "")
    base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode().lower()
    base = re.sub(r"[^a-z0-9._-]+", ".", base).strip("._-")[:40]
    if len(base) < 3:
        base = f"{perfil.proveedor.value.lower()}.{perfil.sujeto[-6:]}"

    candidato, n = base, 1
    while db.scalar(select(Usuario.id).where(Usuario.username == candidato)) is not None:
        n += 1
        candidato = f"{base}{n}"
    return candidato
