from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.schemas.stats import ShopStats
from app.api.deps import get_current_shop

router = APIRouter(prefix="/stats", tags=["stats"])

# Statuts qui comptent comme une vente reelle. PENDING (pas encore
# confirmee) et CANCELLED (annulee) sont exclus du total des ventes.
COUNTED_AS_SALE_STATUSES = [
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
]


@router.get("", response_model=ShopStats)
def get_shop_stats(
    db: Session = Depends(get_db),
    shop: Shop = Depends(get_current_shop),
):
    """Statistiques de base de la boutique du commerçant connecté."""
    total_orders = (
        db.query(func.count(Order.id)).filter(Order.shop_id == shop.id).scalar()
    ) or 0

    total_sales = (
        db.query(func.coalesce(func.sum(Order.total), 0))
        .filter(
            Order.shop_id == shop.id,
            Order.status.in_(COUNTED_AS_SALE_STATUSES),
        )
        .scalar()
    ) or 0

    total_products = (
        db.query(func.count(Product.id)).filter(Product.shop_id == shop.id).scalar()
    ) or 0

    recent_orders = (
        db.query(Order)
        .filter(Order.shop_id == shop.id)
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    def order_to_read(order: Order):
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        return {
            "id": order.id,
            "shop_id": order.shop_id,
            "customer_id": order.customer_id,
            "total": order.total,
            "status": order.status,
            "payment_status": order.payment_status,
            "delivery_status": order.delivery_status,
            "delivery_method": order.delivery_method,
            "delivery_address": order.delivery_address,
            "items": [
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
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }

    return ShopStats(
        total_orders=total_orders,
        total_sales=total_sales,
        total_products=total_products,
        recent_orders=[order_to_read(o) for o in recent_orders],
    )