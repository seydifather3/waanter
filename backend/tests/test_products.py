def test_create_product(client, register_user, auth_headers, create_shop):
    token = register_user("prod1@test.com", "+221770000040")
    create_shop(token)
    resp = client.post(
        "/api/v1/products",
        json={"name": "T-shirt", "price": 5000, "stock": 10},
        headers=auth_headers(token),
    )
    assert resp.status_code == 201
    assert resp.json()["price"] == "5000.00"


def test_negative_price_rejected(client, register_user, auth_headers, create_shop):
    token = register_user("prod2@test.com", "+221770000041")
    create_shop(token)
    resp = client.post(
        "/api/v1/products",
        json={"name": "Produit invalide", "price": -100},
        headers=auth_headers(token),
    )
    assert resp.status_code == 422


def test_negative_stock_rejected(client, register_user, auth_headers, create_shop):
    token = register_user("prod3@test.com", "+221770000042")
    create_shop(token)
    resp = client.post(
        "/api/v1/products",
        json={"name": "Produit invalide", "price": 1000, "stock": -5},
        headers=auth_headers(token),
    )
    assert resp.status_code == 422


def test_product_category_must_belong_to_same_shop(
    client, register_user, auth_headers, create_shop
):
    token_a = register_user("prodA@test.com", "+221770000043")
    create_shop(token_a, name="Boutique A2", phone="+221770000044")

    token_b = register_user("prodB@test.com", "+221770000045")
    create_shop(token_b, name="Boutique B2", phone="+221770000046")
    category_b = client.post(
        "/api/v1/categories",
        json={"name": "Categorie B"},
        headers=auth_headers(token_b),
    ).json()

    resp = client.post(
        "/api/v1/products",
        json={"name": "Produit A", "price": 1000, "category_id": category_b["id"]},
        headers=auth_headers(token_a),
    )
    assert resp.status_code == 400


def test_product_isolation_between_shops(
    client, register_user, auth_headers, create_shop
):
    """
    Test critique : le commercant A ne doit jamais pouvoir lire,
    modifier ou supprimer un produit appartenant au commercant B.
    """
    token_a = register_user("prodIsoA@test.com", "+221770000047")
    create_shop(token_a, name="Boutique IsoA", phone="+221770000048")
    product_a = client.post(
        "/api/v1/products",
        json={"name": "Produit A", "price": 2000},
        headers=auth_headers(token_a),
    ).json()

    token_b = register_user("prodIsoB@test.com", "+221770000049")
    create_shop(token_b, name="Boutique IsoB", phone="+221770000050")

    resp = client.get(
        f"/api/v1/products/{product_a['id']}", headers=auth_headers(token_b)
    )
    assert resp.status_code == 404

    resp = client.patch(
        f"/api/v1/products/{product_a['id']}",
        json={"name": "Piratee"},
        headers=auth_headers(token_b),
    )
    assert resp.status_code == 404

    resp = client.delete(
        f"/api/v1/products/{product_a['id']}", headers=auth_headers(token_b)
    )
    assert resp.status_code == 404