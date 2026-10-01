import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.order import Order, OrderItem
from app.schemas.order import OrderRead
from app.api.deps import get_current_shop

router = APIRouter(prefix="/orders", tags=["orders"])

VALID_STATUSES = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
]


class OrderStatusUpdate(BaseModel):
    status: Literal[
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
    ]


def _order_to_read(db: Session, order: Order) -> OrderRead:
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    return OrderRead(
        id=order.id,
        shop_id=order.shop_id,
        customer_id=order.customer_id,
        total=order.total,
        status=order.status,
        payment_status=order.payment_status,
        delivery_status=order.delivery_status,
        delivery_method=order.delivery_method,
        delivery_address=order.delivery_address,
        items=[
            {
                "id": i.id,
                "product_id": i.product_id,
                "product_name": i.product_name,
                "quantity": i.quantity,
                "unit_price": i.unit_price,
                "subtotal": i.subtotal,
            }
            for i in items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.get("", response_model=list[OrderRead])
def list_orders(
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Liste les commandes de la boutique du commerçant connecté."""
    orders = (
        db.query(Order)
        .filter(Order.shop_id == shop.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_order_to_read(db, o) for o in orders]


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Change le statut d'une commande de la boutique du commerçant connecté."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.shop_id == shop.id)
        .first()
    )
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande introuvable",
        )

    order.status = payload.status
    db.commit()
    db.refresh(order)

    return _order_to_read(db, order)