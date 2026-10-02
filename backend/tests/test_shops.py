def test_create_shop(client, register_user, auth_headers):
    token = register_user("shop1@test.com", "+221770000020")
    resp = client.post(
        "/api/v1/shops",
        json={"name": "Chez Awa", "phone": "+221770000021"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 201
    assert resp.json()["slug"] == "chez-awa"


def test_one_shop_per_user(client, register_user, auth_headers, create_shop):
    token = register_user("shop2@test.com", "+221770000022")
    create_shop(token, name="Boutique A", phone="+221770000023")
    resp = client.post(
        "/api/v1/shops",
        json={"name": "Boutique B", "phone": "+221770000024"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 409


def test_user_without_shop_gets_404(client, register_user, auth_headers):
    token = register_user("shop3@test.com", "+221770000025")
    resp = client.get("/api/v1/shops/me", headers=auth_headers(token))
    assert resp.status_code == 404