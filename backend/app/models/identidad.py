import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.usuario import Usuario


class ProveedorSocial(str, enum.Enum):
    GOOGLE = "GOOGLE"
    FACEBOOK = "FACEBOOK"


class IdentidadExterna(Base):
    """Cuenta de Google o Facebook vinculada a un usuario. Se identifica por el id que da el
    proveedor (`sujeto`), no por el correo: el correo puede cambiar o no venir."""

    __tablename__ = "identidades_externas"
    __table_args__ = (
        # Una cuenta de Google/Facebook pertenece a un solo usuario...
        UniqueConstraint("proveedor", "sujeto", name="uq_identidad_proveedor_sujeto"),
        # ...y un usuario tiene como mucho una cuenta de cada proveedor.
        UniqueConstraint("usuario_id", "proveedor", name="uq_identidad_usuario_proveedor"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True
    )
    usuario_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=False, index=True
    )
    usuario: Mapped[Usuario] = relationship(lazy="raise")
    proveedor: Mapped[ProveedorSocial] = mapped_column(
        Enum(ProveedorSocial, native_enum=False, length=20), nullable=False
    )
    sujeto: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
