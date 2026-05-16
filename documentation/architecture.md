# Architecture

## Current Stack

- Frontend: Next.js + TypeScript planned.
- Frontend data fetching: TanStack Query planned.
- Backend: Node.js + Express + TypeScript.
- Database: PostgreSQL through Supabase.
- ORM: Prisma.
- Auth: JWT access token in httpOnly cookie.
- File storage: local private uploads in development; S3-compatible private bucket later.

## Backend Structure

- `src/app.ts` wires middleware and routes.
- `src/server.ts` starts the Express server.
- `src/config/` handles environment configuration.
- `src/db/` contains database client setup.
- `src/middleware/` contains shared Express middleware.
- `src/modules/` contains feature modules.
- `src/shared/` contains small shared utilities.

## Current Modules

- `auth`
- `health`
- `documents`
- `student-profile`
- `admin/student-profiles`

## Principles

- Keep modules feature-focused.
- Keep business rules in services.
- Keep controllers thin.
- Validate requests at route/controller boundaries.
- Enforce sensitive authorization on the server.
