from fastapi import FastAPI

app = FastAPI(
    title="Waantér API",
    description="API backend pour la plateforme Waantér",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    """
    Endpoint de vérification de santé du service.
    Ne dépend d'aucune ressource externe (base de données, etc.)
    à ce stade du développement.
    """
    return {"status": "ok", "service": "waanter-api"}