from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.shop import Shop

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dépendance FastAPI qui extrait et valide le token JWT du header
    Authorization, puis charge l'utilisateur correspondant depuis la base.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides ou expirés",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception

    return user


def get_current_shop(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Shop:
    """
    Dépendance FastAPI qui retrouve la boutique du commerçant connecté.
    Utilisée par toutes les routes qui gèrent des ressources rattachées
    à un shop (categories, products, orders, ...).

    Lève une 404 si le commerçant n'a pas encore créé de boutique.
    """
    shop = db.query(Shop).filter(Shop.owner_id == current_user.id).first()
    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vous devez d'abord créer votre boutique",
        )
    return shop