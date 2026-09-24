from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """
    Classe de base pour tous les modèles SQLAlchemy de l'application.
    Chaque futur modèle (User, Shop, Product, ...) héritera de Base.
    """
    pass


def get_db():
    """
    Dépendance FastAPI qui fournit une session de base de données,
    et la ferme proprement après la requête (même en cas d'erreur).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()