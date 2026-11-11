from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings


class Base(DeclarativeBase):
    pass


def _build_url() -> URL:
    """Acepta el DB_URL en formato JDBC del backend Java (jdbc:postgresql://...)."""
    s = get_settings()
    raw = s.db_url.removeprefix("jdbc:")
    url = make_url(raw)
    if url.drivername == "postgresql":
        url = url.set(drivername="postgresql+psycopg")
    if s.db_user:
        url = url.set(username=s.db_user)
    if s.db_password:
        url = url.set(password=s.db_password)
    return url


def _create_engine():
    url = _build_url()
    if url.get_backend_name() == "sqlite":
        # Usado por los tests: BD en memoria compartida entre hilos.
        return create_engine(
            url, connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
    return create_engine(url, pool_pre_ping=True)


engine = _create_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    with SessionLocal() as db:
        yield db
