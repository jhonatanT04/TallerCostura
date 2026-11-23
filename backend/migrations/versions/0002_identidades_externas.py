"""Identidades externas: cuentas de Google y Facebook vinculadas a un usuario.

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "identidades_externas",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(sa.Integer(), "sqlite"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column("usuario_id", sa.BigInteger(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("proveedor", sa.String(20), nullable=False),
        sa.Column("sujeto", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255)),
        sa.Column("creado_en", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("proveedor", "sujeto", name="uq_identidad_proveedor_sujeto"),
        sa.UniqueConstraint("usuario_id", "proveedor", name="uq_identidad_usuario_proveedor"),
    )
    op.create_index(
        "ix_identidades_externas_usuario_id", "identidades_externas", ["usuario_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_identidades_externas_usuario_id", table_name="identidades_externas")
    op.drop_table("identidades_externas")
