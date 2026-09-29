from fastapi import HTTPException, UploadFile, status

from app.config import settings


def _detect_image_type(data: bytes) -> tuple[str, str] | None:
    """Détecte le vrai type d'image à partir des premiers octets."""
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp", "image/webp"
    return None


def read_validated_image(file: UploadFile) -> tuple[bytes, str, str]:
    """
    Lit le fichier envoyé et le valide (taille + type réel).
    Renvoie (contenu, extension, content_type).
    """
    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = file.file.read(max_bytes + 1)

    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image trop lourde (maximum {settings.max_upload_mb} Mo)",
        )
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier vide",
        )

    detected = _detect_image_type(data)
    if detected is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format non accepté : utilisez une photo JPEG, PNG ou WebP",
        )

    extension, content_type = detected
    return data, extension, content_type