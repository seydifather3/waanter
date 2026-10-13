from app.core.rate_limit import login_limiter, register_limiter, order_limiter


def test_login_is_rate_limited(client, monkeypatch):
    monkeypatch.setattr(login_limiter, "max_requests", 3)
    payload = {"identifier": "personne@test.com", "password": "mauvais"}

    for _ in range(3):
        assert client.post("/api/v1/auth/login", json=payload).status_code == 401

    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 429
    assert "retry-after" in resp.headers


def test_register_is_rate_limited(client, monkeypatch):
    monkeypatch.setattr(register_limiter, "max_requests", 2)

    for i in range(2):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Test",
                "email": f"limite{i}@test.com",
                "phone": f"+22177000010{i}",
                "password": "Password123!",
            },
        )
        assert resp.status_code == 201

    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test",
            "email": "limite3@test.com",
            "phone": "+221770001039",
            "password": "Password123!",
        },
    )
    assert resp.status_code == 429


def test_order_is_rate_limited(client, monkeypatch):
    monkeypatch.setattr(order_limiter, "max_requests", 2)
    url = "/api/v1/public/shops/boutique-inconnue/orders"
    payload = {
        "customer_name": "Client Test",
        "customer_phone": "+221770000099",
        "delivery_method": "pickup",
        "items": [
            {"product_id": "00000000-0000-0000-0000-000000000001", "quantity": 1}
        ],
    }

    for _ in range(2):
        assert client.post(url, json=payload).status_code == 404

    assert client.post(url, json=payload).status_code == 429