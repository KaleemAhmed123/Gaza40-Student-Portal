# Setup

## Purpose

Document how a developer runs the project locally.

## Prerequisites

- Node.js `22.x` is the target version. This matches Render and `package.json`.
- pnpm `10.18.0` through Corepack. The version is pinned in `package.json`.
- PostgreSQL database. Supabase Postgres is the current hosted option.
- A local `.env` file based on `.env.example`.

## Install

```powershell
corepack pnpm install
```

## Environment

Use `.env.example` as the template for `.env`.

Required:
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_ACCESS_SECRET`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `TRUST_PROXY`
- `COOKIE_SECURE`

Optional:
- `RESEND_API_KEY` enables best-effort query and review email notifications.
- `EMAIL_FROM` sets the sender for Resend emails.
- `RATE_LIMIT_WINDOW_MS` defaults to `900000`.
- `RATE_LIMIT_MAX` defaults to `300`.
- `AUTH_RATE_LIMIT_MAX` defaults to `20`.
- `UPLOAD_RATE_LIMIT_MAX` defaults to `60`.

## Database

For Supabase, prefer the direct connection URL for local migration and seed work. Prisma migrations can use `DIRECT_URL`, but seed scripts use Prisma Client and therefore connect through `DATABASE_URL`.

Recommended local setup:
- `DATABASE_URL`: direct Supabase URL while running migrations/seeds locally.
- `DIRECT_URL`: same direct Supabase URL.
- Later deployment can use the pooler URL for `DATABASE_URL` and direct URL for `DIRECT_URL`.

```powershell
corepack pnpm prisma:generate
corepack pnpm prisma:migrate
corepack pnpm prisma:seed
corepack pnpm prisma:seed:admin
corepack pnpm prisma:seed:regional-admin
```

## Run

```powershell
corepack pnpm dev
```

## Verify

- `GET /health`
- `GET /health/db`

## Deployment

See `deployment.md` for Render/Supabase deployment notes.

Known production gaps are tracked in `mvp-gaps.md`.

## Development Admin

Seeded by:

```powershell
corepack pnpm prisma:seed:admin
```

Default credentials:
- Email: `admin@example.com`
- Password: `AdminPassword123!`

Use only for development/testing.

## Development Regional Admin

Seeded by:

```powershell
corepack pnpm prisma:seed:regional-admin
```

Default credentials:
- Email: `regional.uk@example.com`
- Password: `RegionalPassword123!`
- Country: `UK`

Use only for development/testing.
