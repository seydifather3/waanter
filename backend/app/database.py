from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# prepare_threshold=None : evite les requetes preparees cote serveur,
# qui posent probleme avec le pooler de connexions de Neon.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={"prepare_threshold": None},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """
    Classe de base pour tous les modeles SQLAlchemy de l'application.
    """
    pass


def get_db():
    """
    Dependance FastAPI qui fournit une session de base de donnees,
    et la ferme proprement apres la requete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()