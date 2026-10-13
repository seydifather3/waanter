import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import settings
from app.core.rate_limit import reset_all_limiters

if not settings.test_database_url:
    raise RuntimeError(
        "TEST_DATABASE_URL n'est pas definie. Ajoutez-la dans le fichier .env."
    )

engine = create_engine(settings.test_database_url)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def _reset_rate_limiters():
    """Remet les compteurs de limitation a zero avant chaque test."""
    reset_all_limiters()
    yield


@pytest.fixture()
def db_session():
    """
    Cree un schema de base de donnees vide avant chaque test,
    et le supprime juste apres.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    """Client de test qui utilise la base de donnees de test, pas celle de dev."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def register_user(client):
    """Cree un commercant et renvoie son token d'acces."""

    def _register(
        email: str,
        phone: str,
        password: str = "Password123!",
        name: str = "Test User",
    ) -> str:
        client.post(
            "/api/v1/auth/register",
            json={"name": name, "email": email, "phone": phone, "password": password},
        )
        resp = client.post(
            "/api/v1/auth/login", json={"identifier": email, "password": password}
        )
        return resp.json()["access_token"]

    return _register


@pytest.fixture()
def auth_headers():
    def _headers(token: str) -> dict:
        return {"Authorization": f"Bearer {token}"}

    return _headers


@pytest.fixture()
def create_shop(client, auth_headers):
    """Cree une boutique pour un commercant donne et la renvoie."""

    def _create(
        token: str, name: str = "Ma Boutique", phone: str = "+221770000099"
    ) -> dict:
        resp = client.post(
            "/api/v1/shops",
            json={"name": name, "phone": phone},
            headers=auth_headers(token),
        )
        return resp.json()

    return _create