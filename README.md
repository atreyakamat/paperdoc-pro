# Personal Paperwork OS

Life-based paperwork operating system for Indian users.

## Phase 2 implemented

- Real authentication (register, login, logout, session cookie)
- PostgreSQL persistence via Prisma ORM
- Signed, expiring share links with revoke support
- API-backed documents, usage mapping, reminders, and family vault
- Secure share preview route at `/s/[token]`

## Setup

1. Copy environment template:

```bash
cp .env.example .env
```

2. Set `DATABASE_URL`, `AUTH_SECRET`, `SHARE_LINK_SECRET` in `.env`

3. Install and generate client:

```bash
npm install
npm run prisma:generate
```

4. Push schema to database:

```bash
npm run prisma:push
```

5. Run app:

```bash
npm run dev
```

Open http://localhost:3000

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET|POST /api/documents`
- `GET|POST /api/family`
- `PATCH /api/family/:id`
- `GET|POST /api/shares`
- `GET /api/shares/:id/access`
- `POST /api/shares/:id/revoke`

## Security notes

- Sessions are stored in HTTP-only cookies
- Passwords are hashed with `bcryptjs`
- Share URLs are signed with `jose` JWT and enforced with expiry + revoke checks
