# Personal Paperwork OS

> The missing operating system for Indian life paperwork.

📄 Organize. ⏰ Track expiry. 🔒 Share safely. 👨‍👩‍👧 Family vaults.

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js** 18+
- **Docker** (for PostgreSQL) — _or a hosted Postgres instance_

### 1. Clone & install

```bash
git clone <your-repo-url> paperdoc-pro
cd paperdoc-pro
npm install
```

### 2. Start PostgreSQL with Docker Compose

```bash
docker compose up -d
```

This launches a PostgreSQL 16 container on port `5432` with credentials `postgres/postgres` and database `paperdoc`.

> **No Docker?** Use any PostgreSQL instance. Update `DATABASE_URL` in `.env` accordingly.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paperdoc"

# Generate secrets with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET="replace-with-long-random-secret"
SHARE_LINK_SECRET="replace-with-second-long-random-secret"
```

### 4. Push database schema

```bash
npm run prisma:push
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — register an account and start adding documents.

---

## Deployment Guide

### Option A: Vercel + Hosted PostgreSQL (Recommended)

This is the fastest path to production.

#### 1. Set up a hosted PostgreSQL database

Choose one (all have generous free tiers):

| Provider | Free Tier | Setup Link |
|----------|-----------|------------|
| **Supabase** | 500 MB, 2 projects | [supabase.com](https://supabase.com) |
| **Neon** | 512 MB, 1 project | [neon.tech](https://neon.tech) |
| **Railway** | $5/month credit | [railway.app](https://railway.app) |

After creating a database, copy the **connection string** (format: `postgresql://user:pass@host:5432/dbname`).

#### 2. Push schema to hosted database

```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

#### 3. Deploy to Vercel

```bash
npx vercel
```

Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new).

#### 4. Set environment variables in Vercel

Go to **Project Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your hosted PostgreSQL connection string |
| `AUTH_SECRET` | A 64-character hex string (see generation command above) |
| `SHARE_LINK_SECRET` | A different 64-character hex string |

#### 5. Redeploy

Vercel will auto-redeploy when environment variables change, or trigger manually:

```bash
npx vercel --prod
```

Your app is now live at `https://your-project.vercel.app`.

---

### Option B: Docker Self-Hosted

#### 1. Build the production image

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

> **Note**: For standalone output, add `output: "standalone"` to `next.config.ts`.

#### 2. Build & run

```bash
docker build -t paperdoc-pro .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e AUTH_SECRET="..." \
  -e SHARE_LINK_SECRET="..." \
  paperdoc-pro
```

#### 3. Use with Docker Compose (full stack)

Add an `app` service to `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: paperdoc
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/paperdoc
      AUTH_SECRET: your-secret-here
      SHARE_LINK_SECRET: your-second-secret-here
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

```bash
docker compose up --build
```

---

### Option C: VPS / Cloud VM

Works with any Ubuntu/Debian/RHEL server.

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo -u postgres createdb paperdoc

# 3. Clone and build
git clone <repo-url> /opt/paperdoc-pro
cd /opt/paperdoc-pro
npm ci
npx prisma db push
npm run build

# 4. Run with PM2
npm install -g pm2
pm2 start npm --name paperdoc -- start
pm2 save
pm2 startup
```

Use **nginx** as a reverse proxy for HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name paperdoc.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/paperdoc.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/paperdoc.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx                # Root layout + metadata
│   ├── globals.css               # Animations + utility classes
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard (auth-gated, sidebar + tabs)
│   ├── s/[token]/page.tsx        # Secure share viewer
│   └── api/
│       ├── auth/                 # register, login, logout, me
│       ├── documents/            # GET + POST
│       ├── family/               # GET + POST + PATCH
│       └── shares/               # GET + POST + access + revoke
├── lib/
│   ├── auth.ts                   # JWT sessions (jose) + bcrypt
│   ├── db.ts                     # Prisma singleton
│   ├── paperwork.ts              # Domain types + intelligence logic
│   ├── validators.ts             # Zod input schemas
│   └── constants.ts              # Life categories, usage contexts, purposes
├── prisma/
│   └── schema.prisma             # PostgreSQL schema (5 models)
└── docker-compose.yml            # PostgreSQL for local dev
```

---

## Database Schema

| Model | Purpose |
|---|---|
| `User` | Accounts (email unique + bcrypt password hash) |
| `Document` | Life-categorized documents with expiry, owner, notes |
| `DocumentUsage` | Maps documents → usage contexts (KYC, Banking, etc.) |
| `ShareLink` | Time-limited, watermarked, revocable JWT share tokens |
| `FamilyMember` | Role-based (Viewer/Editor) + emergency access toggle |

---

## Core Features

| Feature | Description |
|---|---|
| 🗂️ Life-Based Organisation | 7 categories: Identity, Education, Health, Finance, Property, Travel, Work |
| ⏰ Smart Expiry Engine | 3 severity tiers: Critical (14d), Warning (45d), Upcoming (90d) |
| 🧠 Usage Intelligence | Maps every document to where it's actually used |
| 🔒 Secure Smart Sharing | JWT-signed time-limited links with watermarks, one-click revoke |
| 👨‍👩‍👧 Family Vault | Role-based access + emergency access toggle |
| 📊 Category Health | Visual breakdown of document coverage per life area |

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:generate` | Regenerate Prisma Client |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT sessions (jose) + bcrypt password hashing
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Language**: TypeScript (strict)

---

*Made for India · Personal Paperwork OS*
