import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.api.deps import get_current_shop

router = APIRouter(prefix="/products", tags=["products"])


def _get_product_or_404(db: Session, shop: Shop, product_id: uuid.UUID) -> Product:
    """
    Retrouve un produit par son ID, en vérifiant qu'il appartient bien
    à la boutique du commerçant connecté (filtrage systématique par shop_id).
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.shop_id == shop.id)
        .first()
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produit introuvable",
        )
    return product


def _validate_category_ownership(db: Session, shop: Shop, category_id: uuid.UUID | None) -> None:
    """
    Si un category_id est fourni, vérifie qu'il appartient bien au shop
    du commerçant connecté. Empêche de rattacher un produit à la
    catégorie d'un autre commerçant.
    """
    if category_id is None:
        return
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.shop_id == shop.id)
        .first()
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Catégorie invalide pour cette boutique",
        )


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Crée un produit pour la boutique du commerçant connecté."""
    _validate_category_ownership(db, shop, payload.category_id)

    product = Product(
        shop_id=shop.id,
        category_id=payload.category_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        image_url=payload.image_url,
        stock=payload.stock,
        active=payload.active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductRead])
def list_products(
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Liste tous les produits de la boutique du commerçant connecté."""
    return (
        db.query(Product)
        .filter(Product.shop_id == shop.id)
        .order_by(Product.created_at.desc())
        .all()
    )


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Récupère un produit précis de la boutique du commerçant connecté."""
    return _get_product_or_404(db, shop, product_id)


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Modifie un produit de la boutique du commerçant connecté."""
    product = _get_product_or_404(db, shop, product_id)

    update_data = payload.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        _validate_category_ownership(db, shop, update_data["category_id"])

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Supprime un produit de la boutique du commerçant connecté."""
    product = _get_product_or_404(db, shop, product_id)
    db.delete(product)
    db.commit()
    return None