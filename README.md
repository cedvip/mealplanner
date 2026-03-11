# MealPlanner

Application web de planification de repas hebdomadaire avec génération automatique de liste de courses.

**Déployé sur** : Vercel | **Base de données** : Neon (PostgreSQL) | **Code** : GitHub

---

## Fonctionnalités

- Gestion de recettes (CRUD) avec ingrédients, quantités et flag végétarien
- Calendrier hebdomadaire (Samedi → Vendredi) pour planifier les repas midi/soir
- Liste de courses générée automatiquement depuis les repas planifiés, quantités ajustées selon les portions
- Authentification email/mot de passe

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth 5 (JWT + bcrypt) |
| ORM | Prisma 6 |
| Base de données | PostgreSQL sur Neon |
| Déploiement | Vercel |

---

## Architecture

### Base de données (`prisma/schema.prisma`)

Prisma est l'ORM — il génère du code TypeScript typé pour interroger la BDD. Le client est instancié une seule fois dans `src/lib/prisma.ts`.

```
User ──┬── WeekPlan ── Meal ── Recipe ── RecipeIngredient ── Ingredient
       ├── Account   (NextAuth)
       └── Session   (NextAuth)
```

| Modèle | Rôle |
|---|---|
| `User` | Compte utilisateur (email + hash du mot de passe) |
| `Recipe` | Recette avec nom, description, portions par défaut, flag végétarien |
| `Ingredient` | Ingrédient réutilisable avec unité par défaut |
| `RecipeIngredient` | Liaison recette ↔ ingrédient avec quantité et unité |
| `WeekPlan` | Plan de la semaine d'un utilisateur (unique par user + date de début) |
| `Meal` | Repas planifié : lien recette → jour + type (LUNCH/DINNER) + portions |

---

### Backend (`src/app/api/`)

Pas de serveur séparé — les routes API sont dans le même projet Next.js. Chaque route vérifie la session (`await auth()`) avant tout traitement.

```
/api/auth/[...nextauth]   → login / logout (NextAuth)
/api/recipes              → GET liste / POST créer
/api/recipes/[id]         → PUT modifier / DELETE supprimer
/api/meals                → POST ajouter un repas au calendrier
/api/meals/[id]           → DELETE supprimer un repas
/api/shopping             → GET générer la liste de courses
```

---

### Frontend (`src/app/`)

Le projet utilise l'**App Router** de Next.js avec deux types de composants :

**Server Components** (sans `"use client"`) — s'exécutent côté serveur :
- Interrogent Prisma directement (pas besoin de passer par l'API)
- Récupèrent les données et les passent aux Client Components

**Client Components** (avec `"use client"`) — s'exécutent dans le navigateur :
- Gèrent l'interactivité et les formulaires
- Communiquent avec le backend via `fetch("/api/...")`

Pattern typique :
```
page.tsx (Server) → lit la BDD via Prisma → passe les données → XxxClient.tsx (Client)
                                                                        ↓
                                                             appelle /api/xxx si action utilisateur
```

Pages :
```
src/app/
├── (auth)/login/         → page de connexion (publique)
└── (main)/               → pages protégées (auth requise)
    ├── calendar/         → calendrier hebdomadaire
    ├── recipes/          → liste et gestion des recettes
    └── shopping/         → liste de courses
```

---

### Authentification (`src/lib/auth.ts`)

- Login email + mot de passe hashé avec **bcrypt**
- Session stockée en **JWT** (token dans le navigateur, pas en BDD)
- Le middleware bloque l'accès aux pages `(main)/` si non connecté

---

### CSS (Tailwind CSS 4)

Pas de fichier CSS séparé — les styles sont écrits directement dans le JSX via des classes Tailwind :
```tsx
className="bg-orange-500 text-white rounded-lg py-2.5 hover:bg-orange-600"
```

Couleur principale : **orange**. Composants UI réutilisables dans `src/components/ui/`.

---

## Variables d'environnement

```env
DATABASE_URL       # Connexion PostgreSQL (Neon)
AUTH_SECRET        # Secret NextAuth pour signer les JWT
FAMILY_EMAIL       # Email du compte par défaut (seed)
FAMILY_PASSWORD    # Mot de passe du compte par défaut (seed)
```

---

## Commandes utiles

```bash
npm run dev              # Démarrer en développement (port 3001)
npm run build            # Build de production
npx prisma studio        # Interface visuelle pour la BDD (port 5555)
npx prisma db push       # Appliquer le schéma sans migration
npx prisma migrate dev   # Créer une migration
npm run db:seed          # Peupler la BDD avec les données initiales
```

---

## Développement local & debug

### Démarrer l'app

```bash
npm run dev
```

L'app tourne sur **http://localhost:3001** (port 3001 pour éviter les conflits).

### Inspecter la base de données

```bash
npx prisma studio
```

Ouvre une interface graphique sur **http://localhost:5555** pour voir et modifier
directement les tables (Users, Recipes, Meals, etc.) en temps réel.

### Logs NextAuth détaillés

Pour voir les détails du middleware d'authentification et des callbacks :

```bash
AUTH_LOG=1 npm run dev
```

### Tester les routes API

Depuis le terminal (exemple pour créer un compte) :

```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.fr","password":"123456"}'
```

### Points importants

- Le `.env` pointe sur la **vraie BDD Neon** — les tests locaux créent de vrais comptes
- Les variables `FAMILY_EMAIL` / `FAMILY_PASSWORD` dans `.env` sont utilisées par le seed
- Le `AUTH_SECRET` local est différent de la prod (normal)
