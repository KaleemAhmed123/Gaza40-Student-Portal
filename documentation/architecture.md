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
- `config`
- `documents`
- `student-profile`
- `admin/student-profiles`
- `offers`
- `queries`
- `announcements`
- `dashboard`
- `admin/students`
- `admin/volunteers`
- `admin/offers`
- `admin/queries`
- `admin/announcements`
- `admin/audit-logs`

## Current API Coverage

- Auth, logout, current user, password reset, and email verification.
- Student profile draft/update/submit and Master Admin profile review.
- Private document upload/download through protected API routes.
- Student offer CRUD, offer submission, admin review, approved-offer revisions, and financial summaries.
- Config/master-data APIs for regions, universities, and dropdown values.
- Query/ticketing APIs for students, admins, regional admins, and mentors.
- Global announcements.
- Admin students, volunteers, and offers grids with filtering, summaries, and CSV export.
- Role-specific dashboards.
- Master Admin audit-log browsing.

## Known Architecture Limits

- Profile submission requires mandatory documents before review.
- Local private uploads are development/demo storage only.
- CSRF middleware is deferred until frontend integration.
- University Processes and Scholarship Processes tabs are intentionally deferred.

## Principles

- Keep modules feature-focused.
- Keep business rules in services.
- Keep controllers thin.
- Validate requests at route/controller boundaries.
- Enforce sensitive authorization on the server.
