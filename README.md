# Bahama Mamas — Espace RH RP

Application web pour la gestion interne du restaurant **Bahama Mamas** sur un serveur RolePlay :
recrutements, démissions, réunions et annonces, avec connexion Discord OAuth, webhooks Discord
et base de données MariaDB. Conçue pour être déployée sur **Vercel**.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- NextAuth v5 (provider Discord) + Prisma Adapter (sessions DB)
- Prisma ORM (provider `mysql`, compatible MariaDB ≥ 10.5)
- Webhooks Discord par module (recrutement / démission / réunion / annonce)

## Modules

| Module | Qui peut publier ? | Qui peut gérer ? |
|---|---|---|
| Recrutements | Tout utilisateur connecté | RH+ (accepter / refuser) |
| Démissions | Employé+ | RH+ voient toutes les démissions |
| Réunions | RH+ | RH+ |
| Annonces | Co-Patron+ | Co-Patron+ |
| Admin (rôles) | — | ADMIN uniquement |

Hiérarchie : `VISITOR < EMPLOYEE < RH < COPATRON < PATRON < ADMIN`.

## 1. Installation locale

```bash
npm install
cp .env.example .env
# Renseigner DATABASE_URL, AUTH_DISCORD_*, AUTH_SECRET, BOOTSTRAP_ADMIN_DISCORD_ID, webhooks
npx prisma db push
npm run dev
```

L'app est dispo sur http://localhost:3000.

## 2. Configurer Discord

1. https://discord.com/developers/applications → **New Application**.
2. Onglet **OAuth2** → Redirects :
   - `http://localhost:3000/api/auth/callback/discord`
   - `https://VOTRE-DOMAINE.vercel.app/api/auth/callback/discord`
3. Copier `Client ID` et `Client Secret` dans `.env` (`AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`).
4. Récupérer votre Discord ID (mode développeur Discord → clic droit sur votre pseudo → Copier l'ID)
   et le mettre dans `BOOTSTRAP_ADMIN_DISCORD_ID`. Vous serez automatiquement promu ADMIN à votre
   premier login.

### Webhooks Discord

Dans Discord : **Paramètres du salon → Intégrations → Webhooks → Nouveau webhook → Copier l'URL**.
Créez un webhook par module (4 salons recommandés) et collez les URLs dans `.env` :

```env
DISCORD_WEBHOOK_RECRUITMENT=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_RESIGNATION=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_MEETING=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_ANNOUNCEMENT=https://discord.com/api/webhooks/...
```

Tous les webhooks sont **optionnels** : si une URL est vide, l'envoi est simplement ignoré.

## 3. Base de données MariaDB

L'app utilise le provider `mysql` de Prisma, parfaitement compatible avec MariaDB ≥ 10.5.
Vercel n'héberge pas MariaDB, prévoyez un service externe :
- VPS / OVH / Hetzner avec MariaDB
- Aiven (MySQL/MariaDB managé)
- Railway, PlanetScale (MySQL)

Format de l'URL :

```
mysql://utilisateur:motdepasse@host:3306/nom_de_la_base
```

⚠️ Si votre hébergeur impose le SSL, ajoutez `?sslaccept=strict` à l'URL.

Initialisation du schéma :

```bash
npx prisma db push     # crée les tables sans migration
# ou (recommandé en équipe)
npx prisma migrate dev --name init
```

## 4. Déploiement Vercel

1. Pousser le repo sur GitHub.
2. Sur https://vercel.com → **New Project** → importer le repo.
3. Dans **Settings → Environment Variables**, ajouter toutes les variables de `.env.example` :
   - `DATABASE_URL`
   - `AUTH_SECRET` (générer avec `openssl rand -base64 32`)
   - `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`
   - `BOOTSTRAP_ADMIN_DISCORD_ID`
   - les 4 `DISCORD_WEBHOOK_*` (optionnels)
   - `NEXTAUTH_URL` = `https://VOTRE-DOMAINE.vercel.app`
4. Déployer. Le `postinstall` génère automatiquement le client Prisma.
5. Pousser le schéma vers la BDD une seule fois (depuis votre machine, avec `DATABASE_URL` pointant
   vers la prod) : `npx prisma db push`.

## 5. Premier login

- Connectez-vous via Discord avec le compte dont l'ID est dans `BOOTSTRAP_ADMIN_DISCORD_ID`.
- Vous serez promu ADMIN automatiquement.
- Allez dans **/admin** pour distribuer les rôles aux autres membres.

## Structure

```
src/
├─ app/
│  ├─ api/                    # Routes API (REST)
│  │  ├─ auth/[...nextauth]/  # NextAuth handlers
│  │  ├─ recrutements/
│  │  ├─ demissions/
│  │  ├─ reunions/
│  │  ├─ annonces/
│  │  └─ admin/users/
│  ├─ recrutements/           # Pages
│  ├─ demissions/
│  ├─ reunions/
│  ├─ annonces/
│  ├─ admin/
│  ├─ login/
│  ├─ layout.tsx
│  ├─ page.tsx
│  └─ globals.css
├─ components/Nav.tsx
├─ lib/
│  ├─ prisma.ts
│  ├─ permissions.ts
│  └─ webhook.ts
├─ auth.ts                    # Configuration NextAuth
└─ auth-handlers.ts
prisma/schema.prisma
```

## Licence

Privée — usage interne Bahama Mamas RP.
