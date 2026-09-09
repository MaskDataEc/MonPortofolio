# MonPortofolio

mon espace numérique qui compile et met en valeur mes meilleures réalisations, compétences et expériences professionnelles

**En ligne :** https://maskdataec.github.io/MonPortofolio/

## Stack

Site statique (HTML/CSS/JS, sans framework) hébergé sur **GitHub Pages**.
Le contenu des sections "Projets" et "Parcours & Certifications" est géré
via **Decap CMS** (`/admin/`), qui écrit directement dans `data/projects.json`
et `data/certifications.json` sur le dépôt GitHub.

## Fonctionnalités

- Mode sombre / clair (préférence système par défaut, choix mémorisé)
- Animations au scroll, effet machine à écrire, compteurs animés
- Surbrillance automatique du lien de navigation de la section visible
- Projets filtrables par catégorie, chargés depuis `data/projects.json`
- Formulaire de contact (Formspree) avec messages de statut inline
- Accessibilité : navigation clavier, `prefers-reduced-motion`, labels,
  aria, décalage des ancres sous la navbar fixe
- SEO : Open Graph / Twitter Card, favicon SVG, `sitemap.xml`, `robots.txt`
- Page 404 personnalisée (`404.html`)
- CV téléchargeable (`assets/uploads/cv-kpatchil-urbain.pdf`)

## CMS : authentification

Depuis 2025, Netlify a abandonné Netlify Identity et Git Gateway (l'ancienne
méthode d'authentification de ce projet). Le CMS utilise le backend GitHub
natif de Decap, avec un petit fournisseur OAuth déployé sur Cloudflare
(dossier `cms-oauth-worker/` à côté de ce dépôt — voir son `README.md`).

Le déploiement est en place : `admin/config.yml` pointe vers
`https://9f9b7d2c.cms-oauth-worker.pages.dev`. En cas de redéploiement du
worker, mettre à jour `base_url` et `auth_endpoint` dans `admin/config.yml`.

## Sécurité

- Le contenu issu du CMS (titres, descriptions, liens) est échappé avant
  injection dans la page (`escapeHTML`/`safeURL` dans `script.js`) pour
  prévenir les attaques XSS.
- Une Content-Security-Policy est définie via balise `<meta>` sur chaque
  page (GitHub Pages ne permet pas de headers HTTP personnalisés).
- Decap CMS est chargé depuis unpkg avec une version figée et un hash
  d'intégrité (SRI), pour éviter qu'une mise à jour non contrôlée du CDN
  ne casse le site ou n'introduise une faille.
- Le formulaire de contact inclut un champ honeypot anti-spam.
- **Recommandation** : active l'authentification à deux facteurs (2FA) sur
  ton compte GitHub. C'est désormais le principal périmètre de sécurité du
  CMS, puisque l'accès à `/admin/` dépend entièrement de ton compte GitHub.
- Limite connue : le widget "fichier" du CMS (preuve de certification)
  accepte n'importe quel type de fichier — c'est une limitation native de
  Decap CMS sans backend de média externe. Le risque reste faible puisque
  seul ton propre compte GitHub authentifié peut publier du contenu.

## À compléter

- Ajouter d'autres projets dans `data/projects.json` (via le CMS ou à la
  main) pour enrichir la section Projets.
- Remplacer le CV généré (`assets/uploads/cv-kpatchil-urbain.pdf`) par une
  version officielle si besoin — le bouton de téléchargement pointe déjà
  vers ce fichier.

