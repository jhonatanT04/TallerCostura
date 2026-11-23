"""Esquema inicial: las tablas que creó el backend anterior (Spring Boot / Hibernate).

En la base que ya existe NO se ejecuta: se marca como aplicada con

    uv run alembic stamp 0001

En una base vacía, `alembic upgrade head` la crea desde cero.

Revision ID: 0001
Revises:
Create Date: 2026-11-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# BIGINT autoincremental en Postgres; INTEGER en SQLite (que solo autoincrementa INTEGER).
ID = sa.BigInteger().with_variant(sa.Integer(), "sqlite")
DINERO = sa.Numeric(10, 2)


def _id() -> sa.Column:
    return sa.Column("id", ID, primary_key=True, autoincrement=True)


def upgrade() -> None:
    op.create_table(
        "usuarios",
        _id(),
        sa.Column("username", sa.String(255), nullable=False, unique=True),
        sa.Column("password", sa.String(255), nullable=False),
        sa.Column("nombre_completo", sa.String(255), nullable=False),
        sa.Column("role", sa.String(255), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("pago_por_blusa", DINERO, nullable=False),
        sa.Column("eliminado", sa.Boolean(), nullable=False),
    )
    op.create_table(
        "clientes",
        _id(),
        sa.Column("nombre", sa.String(255), nullable=False),
        sa.Column("telefono", sa.String(255)),
    )
    op.create_table(
        "ordenes",
        _id(),
        sa.Column("cliente_id", sa.BigInteger(), sa.ForeignKey("clientes.id"), nullable=False),
        sa.Column("fecha_creacion", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "orden_items",
        _id(),
        sa.Column("orden_id", sa.BigInteger(), sa.ForeignKey("ordenes.id"), nullable=False),
        sa.Column("color", sa.String(255), nullable=False),
        sa.Column("cantidad", sa.Integer(), nullable=False),
        sa.Column("precio_unitario", DINERO, nullable=False),
    )
    op.create_table(
        "registros_blusa",
        _id(),
        sa.Column("usuario_id", sa.BigInteger(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("color", sa.String(255), nullable=False),
        sa.Column("talla", sa.String(255), nullable=False),
        sa.Column("cantidad_confeccion", sa.Integer(), nullable=False),
        sa.Column("cantidad_mullos", sa.Integer(), nullable=False),
        sa.Column("cantidad_ataches", sa.Integer(), nullable=False),
        sa.Column("fecha_registro", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "configuracion_pago",
        _id(),
        sa.Column("precio_mullos", DINERO, nullable=False),
        sa.Column("precio_ataches", DINERO, nullable=False),
    )
    op.create_table(
        "ordenes_pago",
        _id(),
        sa.Column("usuario_id", sa.BigInteger(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("semana_inicio", sa.Date(), nullable=False),
        sa.Column("semana_fin", sa.Date(), nullable=False),
        sa.Column("total_blusas", sa.Integer(), nullable=False),
        sa.Column("total_con_mullos", sa.Integer(), nullable=False),
        sa.Column("total_con_ataches", sa.Integer(), nullable=False),
        sa.Column("monto_blusas", DINERO, nullable=False),
        sa.Column("monto_mullos", DINERO, nullable=False),
        sa.Column("monto_ataches", DINERO, nullable=False),
        sa.Column("monto_total", DINERO, nullable=False),
        sa.Column("estado", sa.String(255), nullable=False),
        sa.Column("fecha_pago", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    for tabla in (
        "ordenes_pago",
        "configuracion_pago",
        "registros_blusa",
        "orden_items",
        "ordenes",
        "clientes",
        "usuarios",
    ):
        op.drop_table(tabla)
