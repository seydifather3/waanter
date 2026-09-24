# Waantér — Plateforme boutique en ligne pour commerçants sénégalais

## Description

SaaS B2B multi-tenant permettant à un commerçant sénégalais de créer
gratuitement une boutique en ligne, gérer son catalogue de produits et
recevoir des commandes de ses clients, avec paiement et notifications
WhatsApp prévus en phase 2.

## Stack technique

- Backend : Python 3.12+, FastAPI, SQLAlchemy, Alembic
- Base de données : PostgreSQL
- Frontend : Next.js, TypeScript, Tailwind CSS
- Stockage images : S3-compatible (Cloudflare R2)
- Dev local : Docker Compose

## Structure du repository (monorepo)

backend/     API FastAPI (coeur metier)
frontend/    Application Next.js (dashboard commercant + boutique publique)
docs/        Documentation d'architecture et decisions techniques

## Etat du projet

En developpement - MVP en cours de construction, etape par etape.
Voir docs/ROADMAP.md pour l'avancement.

## Licence

Proprietaire - tous droits reserves. Voir LICENSE.