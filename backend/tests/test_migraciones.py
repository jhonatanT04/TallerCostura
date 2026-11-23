"""Las migraciones de Alembic crean exactamente el esquema de los modelos y se pueden revertir."""

from pathlib import Path

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect

import app.models  # noqa: F401
from app.database import Base

BACKEND = Path(__file__).resolve().parent.parent


def test_migraciones_coinciden_con_los_modelos(tmp_path, monkeypatch):
    motor = create_engine(f"sqlite:///{tmp_path / 'migraciones.db'}")
    # env.py usa el engine de la app; en el test se reemplaza por una base vacía propia.
    monkeypatch.setattr("app.database.engine", motor)

    config = Config(str(BACKEND / "alembic.ini"))
    command.upgrade(config, "head")

    with motor.connect() as conexion:
        diferencias = compare_metadata(MigrationContext.configure(conexion), Base.metadata)
    assert diferencias == []

    command.downgrade(config, "base")
    assert inspect(motor).get_table_names() == ["alembic_version"]
