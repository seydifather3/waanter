def test_create_and_list_categories(client, register_user, auth_headers, create_shop):
    token = register_user("cat1@test.com", "+221770000030")
    create_shop(token)
    resp = client.post(
        "/api/v1/categories", json={"name": "Vetements"}, headers=auth_headers(token)
    )
    assert resp.status_code == 201

    resp = client.get("/api/v1/categories", headers=auth_headers(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_update_and_delete_category(client, register_user, auth_headers, create_shop):
    token = register_user("cat2@test.com", "+221770000031")
    create_shop(token)
    category = client.post(
        "/api/v1/categories", json={"name": "Chaussures"}, headers=auth_headers(token)
    ).json()

    resp = client.patch(
        f"/api/v1/categories/{category['id']}",
        json={"name": "Chaussures Homme"},
        headers=auth_headers(token),
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Chaussures Homme"

    resp = client.delete(
        f"/api/v1/categories/{category['id']}", headers=auth_headers(token)
    )
    assert resp.status_code == 204


def test_category_isolation_between_shops(
    client, register_user, auth_headers, create_shop
):
    """
    Test critique (section 18 du cahier des charges) : le commercant A
    ne doit jamais pouvoir lire, modifier ou supprimer une categorie
    appartenant au commercant B.
    """
    token_a = register_user("shopA_cat@test.com", "+221770000032")
    create_shop(token_a, name="Boutique A", phone="+221770000033")
    category_a = client.post(
        "/api/v1/categories",
        json={"name": "Categorie A"},
        headers=auth_headers(token_a),
    ).json()

    token_b = register_user("shopB_cat@test.com", "+221770000034")
    create_shop(token_b, name="Boutique B", phone="+221770000035")

    resp = client.get("/api/v1/categories", headers=auth_headers(token_b))
    assert all(c["id"] != category_a["id"] for c in resp.json())

    resp = client.patch(
        f"/api/v1/categories/{category_a['id']}",
        json={"name": "Piratee"},
        headers=auth_headers(token_b),
    )
    assert resp.status_code == 404

    resp = client.delete(
        f"/api/v1/categories/{category_a['id']}", headers=auth_headers(token_b)
    )
    assert resp.status_code == 404