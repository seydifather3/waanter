def test_order_total_calculated_server_side(
    client, register_user, auth_headers, create_shop
):
    token = register_user("orderA@test.com", "+221770000060")
    shop = create_shop(token, name="Boutique Commande", phone="+221770000061")
    product = client.post(
        "/api/v1/products",
        json={"name": "Produit X", "price": 10000, "stock": 5},
        headers=auth_headers(token),
    ).json()

    resp = client.post(
        f"/api/v1/public/shops/{shop['slug']}/orders",
        json={
            "customer_name": "Client Test",
            "customer_phone": "+221770000062",
            "delivery_method": "pickup",
            "items": [{"product_id": product["id"], "quantity": 2}],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    # Le total doit etre 2 x 10000 = 20000, calcule par le serveur,
    # jamais a partir d'un prix envoye par le client.
    assert data["total"] == "20000.00"


def test_order_rejects_insufficient_stock(
    client, register_user, auth_headers, create_shop
):
    token = register_user("orderB@test.com", "+221770000063")
    shop = create_shop(token, name="Boutique Stock", phone="+221770000064")
    product = client.post(
        "/api/v1/products",
        json={"name": "Produit rare", "price": 5000, "stock": 1},
        headers=auth_headers(token),
    ).json()

    resp = client.post(
        f"/api/v1/public/shops/{shop['slug']}/orders",
        json={
            "customer_name": "Client Test",
            "customer_phone": "+221770000065",
            "delivery_method": "pickup",
            "items": [{"product_id": product["id"], "quantity": 5}],
        },
    )
    assert resp.status_code == 400


def test_order_delivery_requires_address(
    client, register_user, auth_headers, create_shop
):
    token = register_user("orderC@test.com", "+221770000066")
    shop = create_shop(token, name="Boutique Livraison", phone="+221770000067")
    product = client.post(
        "/api/v1/products",
        json={"name": "Produit Y", "price": 3000, "stock": 10},
        headers=auth_headers(token),
    ).json()

    resp = client.post(
        f"/api/v1/public/shops/{shop['slug']}/orders",
        json={
            "customer_name": "Client Test",
            "customer_phone": "+221770000068",
            "delivery_method": "delivery",
            "items": [{"product_id": product["id"], "quantity": 1}],
        },
    )
    assert resp.status_code == 422


def test_order_rejects_product_from_another_shop(
    client, register_user, auth_headers, create_shop
):
    token_a = register_user("orderD_A@test.com", "+221770000069")
    create_shop(token_a, name="Boutique D A", phone="+221770000070")
    product_a = client.post(
        "/api/v1/products",
        json={"name": "Produit A", "price": 1000, "stock": 10},
        headers=auth_headers(token_a),
    ).json()

    token_b = register_user("orderD_B@test.com", "+221770000071")
    shop_b = create_shop(token_b, name="Boutique D B", phone="+221770000072")

    # On essaie de commander un produit de la boutique A en passant
    # par l'URL publique de la boutique B.
    resp = client.post(
        f"/api/v1/public/shops/{shop_b['slug']}/orders",
        json={
            "customer_name": "Client Test",
            "customer_phone": "+221770000073",
            "delivery_method": "pickup",
            "items": [{"product_id": product_a["id"], "quantity": 1}],
        },
    )
    assert resp.status_code == 400


def test_order_isolation_in_dashboard(
    client, register_user, auth_headers, create_shop
):
    """
    Test critique : le commercant A ne doit jamais voir les commandes
    de la boutique du commercant B dans son dashboard.
    """
    token_a = register_user("orderIsoA@test.com", "+221770000074")
    shop_a = create_shop(token_a, name="Boutique Iso A", phone="+221770000075")
    product_a = client.post(
        "/api/v1/products",
        json={"name": "Produit Iso", "price": 1000, "stock": 10},
        headers=auth_headers(token_a),
    ).json()
    client.post(
        f"/api/v1/public/shops/{shop_a['slug']}/orders",
        json={
            "customer_name": "Client",
            "customer_phone": "+221770000076",
            "delivery_method": "pickup",
            "items": [{"product_id": product_a["id"], "quantity": 1}],
        },
    )

    token_b = register_user("orderIsoB@test.com", "+221770000077")
    create_shop(token_b, name="Boutique Iso B", phone="+221770000078")

    resp = client.get("/api/v1/orders", headers=auth_headers(token_b))
    assert resp.status_code == 200
    assert resp.json() == []