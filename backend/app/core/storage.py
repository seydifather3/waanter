from abc import ABC, abstractmethod
from pathlib import Path

from app.config import settings


class Storage(ABC):
    """
    Interface de stockage. Les routes ne savent pas où va le fichier :
    on pourra ajouter une version Cloudflare R2 sans les modifier.
    """

    public_base_url: str

    @abstractmethod
    def save(self, key: str, data: bytes, content_type: str) -> str:
        """Enregistre le fichier et renvoie son URL publique."""

    @abstractmethod
    def delete(self, key: str) -> None:
        """Supprime le fichier (sans erreur s'il n'existe pas)."""

    def key_from_url(self, url: str) -> str | None:
        """Retrouve la clé de stockage à partir d'une URL publique."""
        prefix = self.public_base_url + "/"
        if url.startswith(prefix):
            return url[len(prefix):]
        return None


class LocalStorage(Storage):
    """Stockage sur disque (développement)."""

    def __init__(self, base_dir: str, public_base_url: str):
        self.base_dir = Path(base_dir).resolve()
        self.public_base_url = public_base_url.rstrip("/")

    def _path(self, key: str) -> Path:
        path = (self.base_dir / key).resolve()
        # Protection : le fichier doit rester dans le dossier de stockage
        if self.base_dir not in path.parents:
            raise ValueError("Chemin de stockage invalide")
        return path

    def save(self, key: str, data: bytes, content_type: str) -> str:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return f"{self.public_base_url}/{key}"

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)


def get_storage() -> Storage:
    if settings.storage_backend == "local":
        return LocalStorage(settings.media_dir, settings.public_media_url)
    raise NotImplementedError(
        f"Stockage '{settings.storage_backend}' non disponible"
    )