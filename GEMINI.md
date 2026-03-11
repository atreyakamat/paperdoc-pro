# Personal Paperwork OS (paperdoc-pro)

The missing operating system for Indian life paperwork. This project helps users organize documents (Aadhaar, PAN, etc.), track expiry, and share them safely using watermarked, time-limited links.

## Project Overview

- **Purpose**: Centralized vault for personal and family documents with "Usage Intelligence" and "Expiry Engine".
- **Target Market**: India (Tailored for Indian document types and use cases).
- **Core Tech Stack**:
    - **Frontend/Backend**: Next.js 16 (App Router)
    - **Database**: PostgreSQL with Prisma ORM
    - **Authentication**: Custom JWT-based session management (`jose` + `bcryptjs`)
    - **Styling**: Tailwind CSS v4 (Dark mode by default)
    - **Validation**: Zod
    - **Language**: TypeScript (Strict)

## Architecture & Structure

- `src/app/api`: RESTful API routes.
    - `auth/`: Login, logout, registration, and session info.
    - `documents/`: CRUD operations for documents.
    - `family/`: Family member management and emergency access.
    - `shares/`: Secure link generation and revocation.
- `src/lib/`: Core utilities and business logic.
    - `auth.ts`: Session and share token logic.
    - `db.ts`: Prisma client singleton.
    - `paperwork.ts`: Expiry engine, usage indexing, and domain logic.
    - `validators.ts`: Zod schemas for request validation.
    - `constants.ts`: Enumerated categories and usage contexts.
- `prisma/schema.prisma`: Data models for `User`, `Document`, `DocumentUsage`, `ShareLink`, and `FamilyMember`.

## Building and Running

### Local Development
1.  **PostgreSQL**: Start via `docker compose up -d` or use a local instance.
2.  **Environment**: Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`, and `SHARE_LINK_SECRET`.
3.  **Setup**:
    ```bash
    npm install
    npm run prisma:push
    ```
4.  **Run**: `npm run dev`

### Production
- **Build**: `npm run build`
- **Start**: `npm start`
- **Deployment**: Optimized for Vercel, Docker, or standard VPS.

## Development Conventions

- **Authentication**:
    - Protect routes using `await getSessionUser()` from `@/lib/auth`.
    - Session is stored in an `httpOnly` cookie named `paperdoc_session`.
- **Database**:
    - Always use the `db` singleton from `@/lib/db`.
    - Cuid is used for all primary keys.
- **API Standards**:
    - Validate all incoming request bodies with `Zod` schemas from `@/lib/validators`.
    - Return `NextResponse.json` with appropriate HTTP status codes (401 for Unauthorized, 400 for Invalid Payload, etc.).
- **Styling**:
    - Use Tailwind CSS v4 utility classes.
    - Follow the established "dark" theme aesthetics (primarily `#080B14` backgrounds with violet/purple accents).
- **Domain Logic**:
    - Document categories, usage contexts, and sharing purposes are strictly typed and defined in `@/lib/constants`.
    - Use helpers in `@/lib/paperwork.ts` for logic like calculating document "severity" based on expiry.
