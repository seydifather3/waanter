from abc import ABC, abstractmethod
from functools import lru_cache
from pathlib import Path

from app.config import settings


class Storage(ABC):
    """
    Interface de stockage. Les routes ne savent pas ou va le fichier :
    disque local en developpement, Cloudflare R2 en production.
    """

    public_base_url: str

    @abstractmethod
    def save(self, key: str, data: bytes, content_type: str) -> str:
        """Enregistre le fichier et renvoie son URL publique."""

    @abstractmethod
    def delete(self, key: str) -> None:
        """Supprime le fichier (sans erreur s'il n'existe pas)."""

    def key_from_url(self, url: str) -> str | None:
        """Retrouve la cle de stockage a partir d'une URL publique."""
        prefix = self.public_base_url + "/"
        if url.startswith(prefix):
            return url[len(prefix):]
        return None


class LocalStorage(Storage):
    """Stockage sur disque (developpement)."""

    def __init__(self, base_dir: str, public_base_url: str):
        self.base_dir = Path(base_dir).resolve()
        self.public_base_url = public_base_url.rstrip("/")

    def _path(self, key: str) -> Path:
        path = (self.base_dir / key).resolve()
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


class R2Storage(Storage):
    """Stockage Cloudflare R2 (API compatible S3)."""

    def __init__(
        self,
        account_id: str,
        access_key_id: str,
        secret_access_key: str,
        bucket: str,
        public_base_url: str,
    ):
        import boto3  # import local : inutile en mode "local"

        self.bucket = bucket
        self.public_base_url = public_base_url.rstrip("/")
        self.client = boto3.client(
            "s3",
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name="auto",
        )

    def save(self, key: str, data: bytes, content_type: str) -> str:
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
        )
        return f"{self.public_base_url}/{key}"

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)


@lru_cache
def get_storage() -> Storage:
    if settings.storage_backend == "local":
        return LocalStorage(settings.media_dir, settings.public_media_url)

    if settings.storage_backend == "r2":
        missing = [
            name
            for name, value in {
                "R2_ACCOUNT_ID": settings.r2_account_id,
                "R2_ACCESS_KEY_ID": settings.r2_access_key_id,
                "R2_SECRET_ACCESS_KEY": settings.r2_secret_access_key,
                "R2_PUBLIC_URL": settings.r2_public_url,
            }.items()
            if not value
        ]
        if missing:
            raise RuntimeError(f"Variables R2 manquantes : {', '.join(missing)}")
        return R2Storage(
            account_id=settings.r2_account_id,
            access_key_id=settings.r2_access_key_id,
            secret_access_key=settings.r2_secret_access_key,
            bucket=settings.r2_bucket,
            public_base_url=settings.r2_public_url,
        )

    raise NotImplementedError(f"Stockage '{settings.storage_backend}' inconnu")