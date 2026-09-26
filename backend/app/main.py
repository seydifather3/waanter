from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.v1 import auth, shops, categories

app = FastAPI(
    title="Waantér API",
    description="API backend pour la plateforme Waantér",
    version="0.1.0",
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(shops.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    """Endpoint de vérification de santé du service."""
    return {"status": "ok", "service": "waanter-api"}


@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    """Vérifie que l'API peut réellement se connecter à PostgreSQL."""
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}