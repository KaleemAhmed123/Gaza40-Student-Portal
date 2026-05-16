# Setup

## Purpose

Document how a developer runs the project locally.

## Prerequisites

- Node.js version:
- pnpm version:
- PostgreSQL/Supabase requirement:
- Required environment variables:

## Install

```powershell
corepack pnpm install
```

## Environment

Use `.env.example` as the template for `.env`.

Required:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `CORS_ORIGIN`
- `COOKIE_SECURE`

## Database

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
