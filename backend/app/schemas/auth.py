from pydantic import BaseModel


class LoginRequest(BaseModel):
    identifier: str  # email ou numéro de téléphone
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"