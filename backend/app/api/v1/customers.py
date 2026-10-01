from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.customer import Customer
from app.schemas.customer import CustomerRead
from app.api.deps import get_current_shop

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerRead])
def list_customers(
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Liste les clients de la boutique du commerçant connecté."""
    return (
        db.query(Customer)
        .filter(Customer.shop_id == shop.id)
        .order_by(Customer.created_at.desc())
        .all()
    )