# MonPortofolio

mon espace numérique qui compile et met en valeur mes meilleures réalisations, compétences et expériences professionnelles

**En ligne :** https://maskdataec.github.io/MonPortofolio/

## Stack

Site statique (HTML/CSS/JS, sans framework) hébergé sur **GitHub Pages**.
Le contenu des sections "Paramètres du site", "Projets" et "Parcours &
Certifications" est géré via **Sveltia CMS** (`/admin/`, compatible avec la
configuration Decap CMS), qui écrit directement dans `data/settings.json`,
`data/projects.json` et `data/certifications.json` sur le dépôt GitHub.

## Modifier le site sans coder (CMS)

Va sur **`https://maskdataec.github.io/MonPortofolio/admin/`** et connecte-toi
avec un Personal Access Token GitHub (voir « CMS : authentification » ci-dessous).
Trois collections :

1. **Paramètres du site** — titre de l'onglet, logo, accroche du hero,
   métiers de l'animation, phrase de présentation, paragraphes « À propos »,
   chiffres clés, citation et coordonnées (écrit dans `data/settings.json`).
2. **Mes Projets** — ajoute/modifie/supprime des projets (image, description,
   technologies, liens).
3. **Mes Certifications** — parcours et preuves téléchargeables.

Après « Publier », le site en ligne est à jour en 1 à 2 minutes (le temps de
la régénération GitHub Pages).

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

Le CMS est **Sveltia CMS** (remplaçant moderne de Decap, même `config.yml`).
La connexion se fait **directement avec un Personal Access Token GitHub** :
plus aucun serveur OAuth à maintenir (l'ancien worker Cloudflare
`cms-oauth-worker/` n'est plus nécessaire).

1. Crée un token sur https://github.com/settings/tokens
   (**Generate new token (classic)**, coche le scope **`repo`**).
2. Va sur `/admin/` et clique **« Se connecter avec un jeton d'accès »**,
   puis colle le token (il reste mémorisé par le navigateur).

## Sécurité

- Le contenu issu du CMS (titres, descriptions, liens) est échappé avant
  injection dans la page (`escapeHTML`/`safeURL` dans `script.js`) pour
  prévenir les attaques XSS.
- Une Content-Security-Policy est définie via balise `<meta>` sur chaque
  page (GitHub Pages ne permet pas de headers HTTP personnalisés).
- Sveltia CMS est chargé depuis unpkg avec une version figée et un hash
  d'intégrité (SRI), pour éviter qu'une mise à jour non contrôlée du CDN
  ne casse le site ou n'introduise une faille.
- Le formulaire de contact inclut un champ honeypot anti-spam.
- **Recommandation** : active l'authentification à deux facteurs (2FA) sur
  ton compte GitHub. C'est désormais le principal périmètre de sécurité du
  CMS, puisque l'accès à `/admin/` dépend entièrement de ton compte GitHub.
- Limite connue : le widget "fichier" du CMS (preuve de certification)
  accepte n'importe quel type de fichier — c'est une limitation native de
  Sveltia CMS sans backend de média externe. Le risque reste faible puisque
  seul ton propre compte GitHub authentifié peut publier du contenu.

## À compléter

- Ajouter d'autres projets dans `data/projects.json` (via le CMS ou à la
  main) pour enrichir la section Projets.
- Remplacer le CV généré (`assets/uploads/cv-kpatchil-urbain.pdf`) par une
  version officielle si besoin — le bouton de téléchargement pointe déjà
  vers ce fichier.

