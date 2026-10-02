def test_register_creates_user(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Awa Diop",
            "email": "awa@test.com",
            "phone": "+221770000010",
            "password": "Password123!",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "awa@test.com"
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email_rejected(client):
    payload = {
        "name": "Awa",
        "email": "awa2@test.com",
        "phone": "+221770000011",
        "password": "Password123!",
    }
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


def test_login_with_email(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Bana",
            "email": "bana@test.com",
            "phone": "+221770000012",
            "password": "Password123!",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"identifier": "bana@test.com", "password": "Password123!"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_with_phone(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Bana",
            "email": "bana2@test.com",
            "phone": "+221770000013",
            "password": "Password123!",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"identifier": "+221770000013", "password": "Password123!"},
    )
    assert resp.status_code == 200


def test_login_wrong_password_rejected(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Cire",
            "email": "cire@test.com",
            "phone": "+221770000014",
            "password": "Password123!",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"identifier": "cire@test.com", "password": "WrongPass"},
    )
    assert resp.status_code == 401


def test_protected_route_requires_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 403