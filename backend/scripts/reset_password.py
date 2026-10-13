"""
Reinitialise le mot de passe d'un commercant (option B : intervention manuelle).

Usage (depuis la racine du projet) :
    docker compose run --rm --no-deps -e DATABASE_URL="ADRESSE" backend \
        python -m scripts.reset_password "email-ou-telephone"

Le script genere un mot de passe temporaire et l'affiche une seule fois.
"""
import secrets
import sys

from sqlalchemy import or_

from app import models  # noqa: F401  (enregistre tous les modeles)
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.user import User

# Alphabet sans caracteres ambigus (pas de 0/O, 1/l/I)
ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def main() -> int:
    if len(sys.argv) != 2:
        print('Usage : python -m scripts.reset_password "email-ou-telephone"')
        return 1

    identifier = sys.argv[1].strip()

    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .filter(or_(User.email == identifier, User.phone == identifier))
            .all()
        )

        if not users:
            print("Aucun compte trouve pour cet identifiant.")
            return 1
        if len(users) > 1:
            print(
                f"{len(users)} comptes correspondent : precisez avec l'email "
                "pour eviter de reinitialiser le mauvais compte."
            )
            return 1

        user = users[0]
        temp_password = "".join(secrets.choice(ALPHABET) for _ in range(10))
        user.password_hash = hash_password(temp_password)
        db.commit()

        print(f"Compte : {user.name} ({user.email})")
        print(f"Mot de passe temporaire : {temp_password}")
        print("Transmettez-le au commercant, puis supprimez ce message.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())