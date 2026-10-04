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

    storage_backend: str = "local"
    media_dir: str = "/data/media"
    public_media_url: str = "http://localhost:8000/media"
    max_upload_mb: int = 5

    # Liste des origines autorisees a contacter l'API, separees par des virgules.
    # En developpement, seul localhost:3000 est autorise par defaut.
    allowed_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()