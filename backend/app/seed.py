import logging

from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.models import Role, Usuario
from app.security.passwords import hash_password

log = logging.getLogger(__name__)


def seed_admin() -> None:
    """Equivalente a AdminSeeder: crea un ADMIN solo si no existe ninguno."""
    s = get_settings()
    with SessionLocal() as db:
        if db.scalar(select(Usuario.id).where(Usuario.role == Role.ADMIN).limit(1)):
            return
        db.add(
            Usuario(
                username=s.admin_username,
                password=hash_password(s.admin_password),
                nombre_completo="Jefa",
                role=Role.ADMIN,
                activo=True,
            )
        )
        db.commit()
    log.warning(
        "No se encontró ninguna cuenta ADMIN; se sembró la cuenta por defecto "
        "username='%s'. Configura ADMIN_USERNAME/ADMIN_PASSWORD o cambia la contraseña cuanto antes.",
        s.admin_username,
    )
