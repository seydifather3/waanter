import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PublicShopRead(BaseModel):
    """Informations publiques d'une boutique (aucune donnée privée)."""
    model_config = ConfigDict(from_attributes=True)

    name: str
    slug: str
    description: str | None
    logo_url: str | None
    phone: str
    address: str | None
    city: str | None


class PublicCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class PublicProductRead(BaseModel):
    """Produit visible par le public. Le stock exact n'est pas exposé."""
    id: uuid.UUID
    category_id: uuid.UUID | None
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    in_stock: bool


class PublicCatalogRead(BaseModel):
    categories: list[PublicCategoryRead]
    products: list[PublicProductRead]