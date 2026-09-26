import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    image_url: str | None = None
    stock: int = Field(default=0, ge=0)
    category_id: uuid.UUID | None = None
    active: bool = True


class ProductUpdate(BaseModel):
    """Tous les champs sont optionnels : seuls ceux fournis sont modifiés."""
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    image_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    category_id: uuid.UUID | None = None
    active: bool | None = None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    shop_id: uuid.UUID
    category_id: uuid.UUID | None
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    stock: int
    active: bool
    created_at: datetime
    updated_at: datetime