from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.category import Category
from app.models.product import Product
from app.schemas.public import (
    PublicShopRead,
    PublicCategoryRead,
    PublicProductRead,
    PublicCatalogRead,
)

router = APIRouter(prefix="/public/shops", tags=["public"])


def _get_active_shop_or_404(db: Session, slug: str) -> Shop:
    shop = (
        db.query(Shop)
        .filter(Shop.slug == slug, Shop.status == "active")
        .first()
    )
    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique introuvable",
        )
    return shop


@router.get("/{slug}", response_model=PublicShopRead)
def get_public_shop(slug: str, db: Session = Depends(get_db)):
    """Infos publiques d'une boutique, accessibles sans authentification."""
    return _get_active_shop_or_404(db, slug)


@router.get("/{slug}/products", response_model=PublicCatalogRead)
def get_public_catalog(slug: str, db: Session = Depends(get_db)):
    """Catégories et produits actifs d'une boutique, sans authentification."""
    shop = _get_active_shop_or_404(db, slug)

    categories = (
        db.query(Category)
        .filter(Category.shop_id == shop.id)
        .order_by(Category.created_at.asc())
        .all()
    )
    products = (
        db.query(Product)
        .filter(Product.shop_id == shop.id, Product.active.is_(True))
        .order_by(Product.created_at.desc())
        .all()
    )

    return PublicCatalogRead(
        categories=[PublicCategoryRead.model_validate(c) for c in categories],
        products=[
            PublicProductRead(
                id=p.id,
                category_id=p.category_id,
                name=p.name,
                description=p.description,
                price=p.price,
                image_url=p.image_url,
                in_stock=p.stock > 0,
            )
            for p in products
        ],
    )