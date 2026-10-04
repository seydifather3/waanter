import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.api.v1 import (
    auth,
    shops,
    categories,
    products,
    public,
    public_orders,
    orders,
    customers,
    stats,
    uploads,
)

app = FastAPI(
    title="Waantér API",
    description="API backend pour la plateforme Waantér",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(shops.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
app.include_router(public_orders.router, prefix="/api/v1")

if settings.storage_backend == "local":
    os.makedirs(settings.media_dir, exist_ok=True)
    app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")


@app.get("/health")
def health_check():
    """Endpoint de verification de sante du service."""
    return {"status": "ok", "service": "waanter-api"}


@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    """Verifie que l'API peut reellement se connecter a PostgreSQL."""
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}