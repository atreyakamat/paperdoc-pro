# Personal Paperwork OS

> The missing operating system for Indian life paperwork.

📄 Organize. ⏰ Track expiry. 🔒 Share safely. 👨‍👩‍👧 Family vaults.

## Quick Start

### 1. Prerequisites

- **Node.js** 18+
- **PostgreSQL** (local or hosted — Supabase, Neon, Railway all work)

### 2. Environment setup

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/paperdoc"

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET="your-long-random-secret-here"
SHARE_LINK_SECRET="your-second-long-random-secret-here"
```

### 3. Install dependencies & push schema

```bash
npm install
npm run prisma:push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (public)
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard app (auth-gated)
│   ├── s/[token]/page.tsx    # Secure share viewer
│   ├── api/
│   │   ├── auth/             # login, register, logout, me
│   │   ├── documents/        # CRUD for documents
│   │   ├── family/           # Family vault management
│   │   └── shares/           # Share link generation & revocation
│   └── globals.css
├── lib/
│   ├── auth.ts               # JWT sessions + bcrypt
│   ├── db.ts                 # Prisma singleton
│   ├── paperwork.ts          # Domain types + intelligence logic
│   ├── validators.ts         # Zod schemas
│   └── constants.ts          # Life categories, usage contexts, purposes
└── prisma/
    └── schema.prisma         # PostgreSQL schema
```

---

## Database Schema (PostgreSQL via Prisma)

| Model | Purpose |
|---|---|
| `User` | Accounts (email + bcrypt hash) |
| `Document` | Life-categorized documents with expiry + notes |
| `DocumentUsage` | Maps each document to usage contexts (KYC, Banking, etc.) |
| `ShareLink` | Time-limited, watermarked, revocable share tokens |
| `FamilyMember` | Role-based (Viewer/Editor) + emergency access |

---

## Core Features

| Feature | Description |
|---|---|
| 🗂️ Life-Based Organisation | 7 categories: Identity, Education, Health, Finance, Property, Travel, Work |
| ⏰ Smart Expiry Engine | Critical (14d), Warning (45d), Upcoming (90d) severity tiers |
| 🧠 Usage Intelligence | Maps every document to its usage contexts |
| 🔒 Secure Smart Sharing | JWT-signed time-limited links, watermarked, revocable |
| 👨‍👩‍👧 Family Vault | Role-based access + emergency access toggle |
| 🔍 Category Health | Count of documents per life area |

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run prisma:push` | Push Prisma schema to your DB |
| `npm run prisma:generate` | Regenerate Prisma Client |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via **Prisma ORM**
- **Auth**: JWT (jose) + bcrypt password hashing
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Language**: TypeScript

---

*Made for India · Personal Paperwork OS*
