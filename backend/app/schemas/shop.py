import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ShopCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    phone: str
    description: str | None = None
    address: str | None = None
    city: str | None = None


class ShopUpdate(BaseModel):
    """
    Tous les champs sont optionnels : seuls ceux fournis seront modifiés.
    Le slug n'est volontairement pas modifiable ici (voir décision technique).
    """
    name: str | None = Field(default=None, min_length=2, max_length=150)
    phone: str | None = None
    description: str | None = None
    address: str | None = None
    city: str | None = None
    logo_url: str | None = None


class ShopRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    phone: str
    address: str | None
    city: str | None
    status: str
    created_at: datetime
    updated_at: datetime