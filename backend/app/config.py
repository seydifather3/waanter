from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuration centralisée de l'application, lue depuis les
    variables d'environnement (fichier .env en local, ou variables
    injectées par Docker Compose / l'hébergeur en production).
    """

    database_url: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()