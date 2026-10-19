# Boutik — Application e-commerce MERN

Application web de vente en ligne (MongoDB, Express, React, Node.js) réalisée d'après le cahier des charges.

## Prérequis
- Node.js 18 ou plus
- MongoDB en local (`mongodb://127.0.0.1:27017`) ou une base MongoDB Atlas

## Installation

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # puis adaptez MONGO_URI et JWT_SECRET
npm run seed                # crée l'admin, 5 clients, catégories, vendeurs, 12 produits, bannières, commandes et devis
npm run dev                 # API sur http://localhost:5000
```

### 2. Frontend (dans un second terminal)
```bash
cd frontend
npm install
npm run dev                 # site sur http://localhost:5173
```

## Comptes de test (créés par `npm run seed`)
| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@boutik.sn | Admin123! |
| Client | client@boutik.sn | Client123! |

Codes promo de démonstration : `BIENVENUE10` (−10 %) et `TABASKI5000` (−5 000 FCFA dès 20 000 FCFA). Le seed crée aussi 18 commandes sur 30 jours (pour les graphiques) et quelques avis.

## Fonctionnalités
**Client** : inscription, connexion, catalogue, recherche par nom, filtre par catégorie, détail produit, panier (ajout, suppression, quantité, total), commande avec adresse de livraison, suivi de « Mes commandes » (annulation tant que la commande est en attente), modification du profil.

**Administrateur** : tableau de bord (produits, clients, commandes, ventes), ajout / modification / suppression de produits (avec envoi d'image), création de catégories, consultation de toutes les commandes et changement de statut (En attente → Confirmée → Expédiée → Livrée, ou Annulée).

**Codes promo** : le client saisit un code dans le panier (aperçu de la remise) ; l'admin crée des codes en pourcentage ou en montant fixe, avec minimum de commande, nombre d'utilisations maximum et date d'expiration, et peut les activer / désactiver (page *Codes promo*). La remise est recalculée et l'utilisation du code réservée côté serveur ; une commande annulée rend l'utilisation du code.

**Avis et favoris** : un client peut noter un produit (1 à 5 étoiles + commentaire) une fois sa commande livrée, un seul avis par produit (un nouvel envoi le remplace) ; la note moyenne s'affiche sur les cartes et la fiche produit. Le cœur ajoute un produit aux favoris (page *Favoris*).

**Tableau de bord** : voir la section « Espace administrateur » ci-dessous.

**Sécurité** : mots de passe hachés avec bcrypt, authentification JWT, routes protégées côté API et côté React, gestion des rôles (le rôle admin ne peut pas être choisi à l'inscription).

**Règles métier** : le prix et le total d'une commande sont recalculés côté serveur ; le stock est décrémenté à la commande et remis en vente si la commande est annulée ; numéros de commande #1001, #1002…


## Nouveautés inspirées d'Alibaba et d'Amazon

**Boutique**
- En-tête à deux étages : adresse de livraison, recherche par catégorie, « Compte et listes », panier avec compteur, barre de liens (Ventes Flash, Meilleures ventes, Nouveautés, Livraison gratuite, Demander un devis) et menu « Toutes » avec les catégories.
- Accueil : carrousel de bannières, tuiles de catégories, rangées défilantes (Ventes Flash avec compte à rebours, Meilleures ventes classées, Nouveautés, Livraison gratuite, Sélection, Consultés récemment), bloc « Demander un devis », bandeau de confiance.
- Catalogue : filtres latéraux (catégorie, avis, prix, livraison gratuite, ventes flash, promotions, en stock), tris, pagination, filtres actifs dans l'URL.
- Carte produit : remise en %, ancien prix barré, note, quantité minimum (MOQ), nombre de ventes, livraison gratuite, vendeur vérifié.
- Fiche produit : galerie d'images, prix dégressifs par quantité, quantité minimum, caractéristiques, bloc livraison et protection des commandes, fiche vendeur (note, temps de réponse, livraison à l'heure, taux de réachat), répartition des avis, « Acheter maintenant », recommandations.
- Devis (RFQ) et « Discuter avec le vendeur » : messagerie client ↔ administrateur (`/mes-devis`, `/demande-devis`).
- Panier : prix dégressifs, indication du palier suivant, barre de progression vers la livraison gratuite, frais de livraison, mode de paiement à la livraison (espèces, Wave, Orange Money).
- Commandes : suivi par étapes, « Acheter à nouveau », facture imprimable.
- Centre d'aide, bandeau de cookies, pied de page complet.

## Espace administrateur
Accessible sur `/admin` (barre latérale, adaptée au mobile) :
- **Tableau de bord** : chiffre d'affaires, commandes, panier moyen et nouveaux clients avec l'évolution par rapport à la période précédente (7 / 30 / 90 jours), courbe des ventes avec infobulle, meilleurs produits, ventes par catégorie, commandes par statut, alertes de stock, dernières commandes.
- **Produits** : recherche, filtres (catégorie, stock bas, épuisés, masqués), pagination, publication en un clic, duplication ; formulaire complet : images multiples, prix barré, vente flash, prix dégressifs, MOQ, caractéristiques, vendeur, livraison gratuite, sélection, aperçu en direct.
- **Catégories** (avec icône), **Vendeurs**, **Bannières** (avec image), **Codes promo**, **Avis clients** (modération).
- **Commandes** : onglets par statut avec compteurs, recherche (n°, client, téléphone), période, panneau de détail avec suivi, note interne, facture, export CSV.
- **Devis et messages** : boîte de réception avec réponses et statuts.
- **Clients** : total dépensé, dernière commande, historique, suspension de compte.
- **Paramètres** : nom, bandeau d'annonce, frais de livraison, seuil de livraison gratuite, délai de retour, seuil de stock bas.

## API
| Méthode | Route | Accès |
|---|---|---|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| GET / PUT | /api/auth/profile | connecté |
| GET | /api/products?search=&category=&minPrice=&maxPrice=&minRating=&freeShipping=1&inStock=1&promo=1&flash=1&sort=&page=&limit= | public (sans `page` : tableau ; avec `page` : `{ items, total, page, pages }`) |
| GET | /api/products/:id/related | public |
| POST | /api/products/:id/duplicate | admin |
| GET | /api/products/:id | public |
| POST / PUT / DELETE | /api/products, /api/products/:id | admin |
| POST | /api/products/upload | admin |
| GET | /api/categories | public |
| POST / PUT / DELETE | /api/categories, /api/categories/:id | admin |
| GET | /api/orders?status=&q=&from=&to=&page= | admin |
| GET | /api/orders/export | admin (CSV) |
| GET | /api/orders/mine | connecté (mes commandes) |
| POST | /api/orders | connecté |
| GET | /api/orders/:id | propriétaire ou admin |
| PUT | /api/orders/:id | admin (statut, note interne) ; client (annuler si en attente) |
| GET | /api/stats?days=7\|30\|90 | admin (indicateurs, ventes, alertes) |
| GET | /api/stats/summary | admin (pastilles de la barre latérale) |
| GET / PUT / DELETE | /api/users, /api/users/:id | admin (clients, suspension) |
| POST / GET | /api/inquiries, /api/inquiries/mine | connecté (devis, questions) |
| GET / PUT | /api/inquiries, /api/inquiries/:id | admin (boîte de réception, statut) |
| POST | /api/inquiries/:id/messages | propriétaire ou admin |
| GET / POST / PUT / DELETE | /api/suppliers | admin |
| GET | /api/banners | public (actives) ; admin avec `?all=1` |
| POST / PUT / DELETE | /api/banners | admin |
| GET / PUT | /api/settings | public (lecture) ; admin (modification) |
| GET | /api/reviews | admin (modération) |
| POST | /api/coupons/validate | connecté |
| GET / POST / PUT / DELETE | /api/coupons, /api/coupons/:id | admin |
| GET | /api/products/:id/reviews | public |
| POST | /api/products/:id/reviews | client ayant reçu le produit |
| DELETE | /api/reviews/:id | auteur ou admin |
| GET | /api/favorites | connecté |
| PUT / DELETE | /api/favorites/:productId | connecté |
| GET | /api/health | public (contrôle de santé) |

## Structure
```
backend/   app.js, server.js, config, models (User, Product, Category, Order, Coupon, Review, Supplier, Banner, Settings, Inquiry), controllers, routes, middleware, utils, tests, seed.js
frontend/  src/pages (+ admin), components, context (Auth, Cart, Favorites, Settings), api.js, styles.css, store.css, admin.css
docker-compose.yml, render.yaml, .github/workflows/ci.yml
```

## Tests
```bash
cd backend
npm install
npm test
```
Jest + Supertest, avec une base MongoDB en mémoire (`mongodb-memory-server` télécharge un binaire MongoDB au premier lancement, une connexion Internet est donc nécessaire la première fois). Ils couvrent l'authentification et les rôles, le calcul des commandes côté serveur, le stock, les codes promo (expiration, minimum, épuisement, annulation), les avis, les favoris et les statistiques. L'intégration continue (GitHub Actions) lance les tests et le build du frontend à chaque push.

## Déploiement

### Docker (tout-en-un)
```bash
cp .env.docker.example .env      # puis changez JWT_SECRET
docker compose up --build
docker compose exec backend node seed.js   # données de démonstration (efface la base)
```
La boutique est disponible sur http://localhost:8080 (nginx sert le frontend et redirige `/api` et `/uploads` vers le backend). MongoDB et les images envoyées sont conservées dans des volumes Docker.

### Render + MongoDB Atlas
1. Créez un cluster gratuit sur MongoDB Atlas et récupérez l'URI de connexion (autorisez l'accès réseau depuis Render).
2. Poussez le projet sur GitHub, puis sur Render : *New → Blueprint* (le fichier `render.yaml` crée l'API et le site statique).
3. Renseignez `MONGO_URI`, `CLIENT_URL` (URL du site) et `VITE_API_URL` (URL de l'API, sans `/api`), puis redéployez le site statique pour que la variable soit prise en compte.
4. Lancez le seed une fois (onglet *Shell* du service API : `node seed.js`), puis **changez les mots de passe des comptes de démonstration**.

Les images envoyées sont stockées sur le disque du serveur : sur Render, il faut un disque persistant (offre payante, déjà prévu dans `render.yaml`), sinon elles disparaissent à chaque redéploiement. Pour éviter cette contrainte, utilisez des URL d'images externes ou un stockage type Cloudinary.

### Vercel pour le frontend
Importez le dossier `frontend`, définissez `VITE_API_URL` avec l'URL du backend ; `vercel.json` gère les routes React Router. Définissez aussi `CLIENT_URL` côté backend avec l'URL Vercel (CORS).

## Idées pour aller plus loin
Paiement en ligne (Wave, Orange Money, Stripe — aujourd'hui le mode choisi est seulement enregistré, le paiement se fait à la livraison), notifications par e-mail ou SMS, recherche par image, demandes de retour, stockage d'images externe (Cloudinary), limitation de débit et en-têtes de sécurité (helmet).
