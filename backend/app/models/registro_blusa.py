from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.usuario import Usuario


class RegistroBlusa(Base):
    """Trabajo hecho por una empleada sobre blusas de un color y talla.

    Confección, mullos y ataches son trabajos independientes: una empleada puede
    poner mullos/ataches a blusas que confeccionó otra, por eso cada uno lleva su
    propia cantidad. `fecha_registro` siempre la asigna el servidor.
    """

    __tablename__ = "registros_blusa"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True
    )
    usuario_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=False
    )
    usuario: Mapped[Usuario] = relationship(lazy="raise")
    color: Mapped[str] = mapped_column(String(255), nullable=False)
    talla: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad_confeccion: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cantidad_mullos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cantidad_ataches: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
