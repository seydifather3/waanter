from decimal import Decimal

from pydantic import BaseModel

from app.schemas.order import OrderRead


class ShopStats(BaseModel):
    total_orders: int
    total_sales: Decimal
    total_products: int
    recent_orders: list[OrderRead]