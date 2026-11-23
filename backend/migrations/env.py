"""Migraciones de Alembic. Usan la misma conexión que la API (DB_URL, DB_USER, DB_PASSWORD).

    uv run alembic upgrade head                      # aplica las migraciones pendientes
    uv run alembic revision --autogenerate -m "..."  # crea una a partir de los modelos
"""

from logging.config import fileConfig

from alembic import context

import app.models  # noqa: F401  registra todos los modelos en Base.metadata
from app.database import Base, engine

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Genera el SQL sin conectarse (uv run alembic upgrade head --sql)."""
    context.configure(
        url=engine.url.render_as_string(hide_password=False),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
