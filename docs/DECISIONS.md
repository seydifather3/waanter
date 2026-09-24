# Journal des decisions techniques (ADR simplifie) - Waanter

---

## 2026-09-24 - Nom du projet : Waanter

Decision : Le produit s'appelle Waanter.

---

## 2026-09-24 - Structure monorepo

Decision : Backend et frontend dans un seul repository Git.
Justification : Equipe reduite, iterations rapides cross-stack.

---

## 2026-09-24 - PostgreSQL 16 via Docker Compose

Decision : Utilisation de l'image postgres:16-alpine pour le developpement local.
Justification : Version stable recente, image legere, support JSONB/UUID natif.