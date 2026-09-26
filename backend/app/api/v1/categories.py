import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryRead
from app.api.deps import get_current_shop

router = APIRouter(prefix="/categories", tags=["categories"])


def _get_category_or_404(db: Session, shop: Shop, category_id: uuid.UUID) -> Category:
    """
    Retrouve une catégorie par son ID, en vérifiant qu'elle appartient
    bien à la boutique du commerçant connecté.

    C'est LE point critique de sécurité multi-tenant pour cette ressource :
    on filtre TOUJOURS par shop_id en plus de l'ID demandé, jamais
    uniquement par l'ID fourni par le client.
    """
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.shop_id == shop.id)
        .first()
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie introuvable",
        )
    return category


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Crée une catégorie pour la boutique du commerçant connecté."""
    category = Category(shop_id=shop.id, name=payload.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("", response_model=list[CategoryRead])
def list_categories(
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Liste toutes les catégories de la boutique du commerçant connecté."""
    return (
        db.query(Category)
        .filter(Category.shop_id == shop.id)
        .order_by(Category.created_at.asc())
        .all()
    )


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Modifie une catégorie de la boutique du commerçant connecté."""
    category = _get_category_or_404(db, shop, category_id)
    category.name = payload.name
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Supprime une catégorie de la boutique du commerçant connecté."""
    category = _get_category_or_404(db, shop, category_id)
    db.delete(category)
    db.commit()
    return None