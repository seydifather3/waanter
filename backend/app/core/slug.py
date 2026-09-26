import re
import unicodedata

from sqlalchemy.orm import Session

from app.models.shop import Shop


def slugify(value: str) -> str:
    """
    Transforme une chaîne en slug URL-friendly.
    Exemple : "Chez Fatou !" -> "chez-fatou"
    """
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value or "boutique"


def generate_unique_slug(db: Session, name: str) -> str:
    """
    Génère un slug unique pour une boutique, en ajoutant un suffixe
    numérique si le slug de base existe déjà.
    """
    base_slug = slugify(name)
    slug = base_slug
    counter = 2

    while db.query(Shop).filter(Shop.slug == slug).first() is not None:
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug