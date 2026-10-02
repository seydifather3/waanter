import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=150)
    customer_phone: str = Field(min_length=6, max_length=30)
    delivery_method: Literal["delivery", "pickup"]
    delivery_address: str | None = None
    items: list[OrderItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def address_required_if_delivery(self) -> "OrderCreate":
        if self.delivery_method == "delivery" and not self.delivery_address:
            raise ValueError("L'adresse est obligatoire pour une livraison")
        return self


class OrderItemRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class OrderRead(BaseModel):
    id: uuid.UUID
    shop_id: uuid.UUID
    customer_id: uuid.UUID
    total: Decimal
    status: str
    payment_status: str
    delivery_status: str
    delivery_method: str
    delivery_address: str | None
    items: list[OrderItemRead]
    created_at: datetime
    updated_at: datetime