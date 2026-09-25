import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str


class UserCreate(UserBase):
    """Schéma utilisé pour créer un utilisateur (reçoit un mot de passe en clair)."""
    password: str


class UserRead(UserBase):
    """Schéma utilisé pour renvoyer un utilisateur (ne renvoie jamais le mot de passe)."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    created_at: datetime
    updated_at: datetime