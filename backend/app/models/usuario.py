import enum
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, Enum, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    EMPLEADO = "EMPLEADO"


class Usuario(Base):
    """Mapea la tabla `usuarios` que crea Hibernate (nombres en snake_case).

    El esquema lo sigue gestionando el backend Java (ddl-auto: update);
    aquí NO se crean ni alteran tablas en Postgres.
    """

    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True
    )
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre_completo: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(
        Enum(Role, native_enum=False, length=255), nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    pago_por_blusa: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0")
    )
    eliminado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    @property
    def habilitado(self) -> bool:
        # Equivalente a CustomUserDetailsService: disabled = !activo || eliminado
        return self.activo and not self.eliminado
