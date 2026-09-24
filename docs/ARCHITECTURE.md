# Architecture - Waanter

## Vue d'ensemble

Frontend (Next.js)
        |
        | HTTPS / REST API
        v
Backend (FastAPI)  <-- coeur metier
        |
        +-- PostgreSQL (donnees)
        +-- Object Storage S3-compatible (images produits/logos)
        +-- Payment APIs (Wave, Orange Money) [Phase 2]
        +-- WhatsApp Business API [Phase 2]
        +-- n8n (automatisations secondaires) [Phase 3]
        +-- AI Service [Phase 4]

## Principe fondamental

Le backend FastAPI est le coeur metier autonome. Toute dependance externe
(n8n, WhatsApp, paiement, IA) est un greffon optionnel.

Regle de robustesse : si n8n, WhatsApp, le paiement ou l'IA sont hors
service, le systeme central doit continuer a fonctionner :
- les utilisateurs peuvent se connecter,
- les produits sont gerables,
- les commandes sont enregistrees,
- le dashboard fonctionne.

## Multi-tenant

Chaque commercant possede un shop_id. Toute ressource commerciale
(categories, produits, clients, commandes, paiements, livraisons,
abonnement) est rattachee a un shop_id.

Isolation stricte : un utilisateur ne doit jamais acceder aux donnees
d'un shop_id qui ne lui appartient pas.

## Securite des donnees financieres

- Le prix envoye par le frontend n'est jamais fiable.
- Le total d'une commande est toujours recalcule cote serveur.
- Une commande est creee dans une transaction atomique.
- Un paiement n'est jamais marque "PAYE" sur simple declaration du frontend.