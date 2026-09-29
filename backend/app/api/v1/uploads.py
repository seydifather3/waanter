import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.schemas.shop import ShopRead
from app.schemas.product import ProductRead
from app.core.storage import get_storage
from app.core.uploads import read_validated_image
from app.api.deps import get_current_shop
from app.api.v1.products import _get_product_or_404

router = APIRouter(tags=["uploads"])


def _delete_old_file(old_url: str | None) -> None:
    """Supprime l'ancienne image (au mieux : une erreur ici ne bloque rien)."""
    if not old_url:
        return
    try:
        storage = get_storage()
        key = storage.key_from_url(old_url)
        if key:
            storage.delete(key)
    except Exception:
        pass


@router.post("/shops/me/logo", response_model=ShopRead)
def upload_shop_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Envoie ou remplace le logo de la boutique du commerçant connecté."""
    data, extension, content_type = read_validated_image(file)

    key = f"shops/{shop.id}/logo-{uuid.uuid4().hex}.{extension}"
    url = get_storage().save(key, data, content_type)

    old_url = shop.logo_url
    shop.logo_url = url
    db.commit()
    db.refresh(shop)

    _delete_old_file(old_url)
    return shop


@router.post("/products/{product_id}/image", response_model=ProductRead)
def upload_product_image(
    product_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Envoie ou remplace la photo d'un produit de la boutique connectée."""
    product = _get_product_or_404(db, shop, product_id)
    data, extension, content_type = read_validated_image(file)

    key = f"shops/{shop.id}/products/{product.id}-{uuid.uuid4().hex}.{extension}"
    url = get_storage().save(key, data, content_type)

    old_url = product.image_url
    product.image_url = url
    db.commit()
    db.refresh(product)

    _delete_old_file(old_url)
    return product