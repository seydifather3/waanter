from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuration centralisee de l'application, lue depuis les
    variables d'environnement.
    """

    database_url: str
    test_database_url: str | None = None

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 jours

    # Stockage des images : "local" (dev) ou "r2" (production)
    storage_backend: str = "local"
    media_dir: str = "/data/media"
    public_media_url: str = "http://localhost:8000/media"
    max_upload_mb: int = 5

    # Cloudflare R2 (utilises seulement si storage_backend == "r2")
    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket: str = "waanter-images"
    r2_public_url: str | None = None

    allowed_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()