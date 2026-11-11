import os

# Configuración de test ANTES de importar la app (BD en memoria, nunca Postgres).
os.environ.update(
    DB_URL="sqlite://",
    DB_USER="",
    DB_PASSWORD="",
    JWT_SECRET_KEY="test-secret-key-de-al-menos-32-bytes!!",
    ADMIN_USERNAME="jefa",
    ADMIN_PASSWORD="jefa1234",
)

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture
def client():
    Base.metadata.create_all(engine)
    with TestClient(app) as c:  # ejecuta el lifespan (seeder del ADMIN)
        yield c
    Base.metadata.drop_all(engine)


def login(client: TestClient, username: str, password: str) -> str:
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin(client) -> dict:
    return auth(login(client, "jefa", "jefa1234"))
