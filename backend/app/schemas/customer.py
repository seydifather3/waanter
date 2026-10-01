import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    shop_id: uuid.UUID
    name: str
    phone: str
    address: str | None
    created_at: datetime
    updated_at: datetime