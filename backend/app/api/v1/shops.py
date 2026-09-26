from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.schemas.shop import ShopCreate, ShopUpdate, ShopRead
from app.core.slug import generate_unique_slug
from app.api.deps import get_current_user

router = APIRouter(prefix="/shops", tags=["shops"])


@router.post("", response_model=ShopRead, status_code=status.HTTP_201_CREATED)
def create_shop(
    payload: ShopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Crée la boutique du commerçant connecté.
    Un commerçant ne peut avoir qu'une seule boutique (règle MVP).
    """
    existing_shop = db.query(Shop).filter(Shop.owner_id == current_user.id).first()
    if existing_shop is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vous possédez déjà une boutique",
        )

    slug = generate_unique_slug(db, payload.name)

    shop = Shop(
        owner_id=current_user.id,
        name=payload.name,
        slug=slug,
        phone=payload.phone,
        description=payload.description,
        address=payload.address,
        city=payload.city,
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)

    return shop


@router.get("/me", response_model=ShopRead)
def get_my_shop(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Renvoie la boutique du commerçant connecté.
    """
    shop = db.query(Shop).filter(Shop.owner_id == current_user.id).first()
    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vous n'avez pas encore créé de boutique",
        )
    return shop


@router.patch("/me", response_model=ShopRead)
def update_my_shop(
    payload: ShopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Modifie la boutique du commerçant connecté.
    Seuls les champs fournis (non None) sont mis à jour.
    """
    shop = db.query(Shop).filter(Shop.owner_id == current_user.id).first()
    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vous n'avez pas encore créé de boutique",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shop, field, value)

    db.commit()
    db.refresh(shop)

    return shop