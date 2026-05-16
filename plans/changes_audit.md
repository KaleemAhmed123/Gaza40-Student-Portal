# Changes Audit

This file tracks the final implementation state after the early schema/API simplification pass. Earlier abandoned intermediate designs were removed so this audit matches the current codebase.

## 2026-05-16 - Project Guardrails And Planning Docs

### Files Added

- `AGENT.md`
  - Added project-specific Codex instructions.
  - Established `vision/requirements.md` as the MVP source of truth.
  - Established `vision/problem_statement.md` as context only.
  - Added collaboration rule: Codex is assistant, not pilot.
  - Added tech-lead pushback rule for constructive criticism.
  - Added requirement to update this audit after code changes.

- `ENGINEERING.md`
  - Added concise engineering rules focused on simplicity, readability, reuse, security, testing, and avoiding scope drift.

### Planning Files Added

- `plans/00_requirements_audit.md`
- `plans/01_user_journeys.md`
- `plans/02_data_model.md`
- `plans/03_architecture_decisions.md`
- `plans/04_security_rbac.md`
- `plans/05_mvp_scope.md`

These documents define the initial planning baseline and keep the work anchored to `vision/requirements.md`.

## 2026-05-16 / 2026-05-17 - Backend Foundation

### Project Setup

- `.gitignore`
  - Ignores dependencies, build output, environment files, upload storage, and logs.

- `.env.example`
  - Added local development environment template.
  - Includes API, JWT, CORS, cookie, and development admin variables.

- `package.json`
  - Added Express/TypeScript/Prisma backend scripts:
    - `dev`
    - `build`
    - `start`
    - `lint`
    - `prisma:generate`
    - `prisma:migrate`
    - `prisma:seed`
    - `prisma:seed:admin`
    - `prisma:seed:regional-admin`
    - `prisma:studio`

- `tsconfig.json`
  - Added strict TypeScript configuration.

### API Foundation

- `src/config/env.ts`
  - Added environment validation.

- `src/db/prisma.ts`
  - Added shared Prisma client.

- `src/shared/http.ts`
  - Added `ApiError`, `asyncHandler`, and `sendSuccess`.

- `src/shared/audit.ts`
  - Added audit-log helper.

- `src/middleware/auth.middleware.ts`
  - Added JWT cookie auth middleware.
  - Added role checks based on `User.roles`.
  - Added DB-backed role validation for sensitive routes.

- `src/middleware/error.middleware.ts`
  - Added not-found and global error handling.
  - Added clean Zod, multer, malformed JSON, Prisma unique, and Prisma foreign-key errors.

- `src/app.ts`
  - Added Express app, security middleware, CORS, JSON parsing, cookies, logging, and route mounting.

- `src/server.ts`
  - Added API startup and graceful Prisma disconnect.

- `src/modules/health/health.routes.ts`
  - Added `GET /health`.
  - Added `GET /health/db`.

## 2026-05-16 / 2026-05-17 - Final Database Schema

### Prisma Schema

- `prisma/schema.prisma`
  - Added PostgreSQL datasource and Prisma client generator.
  - Added enums:
    - `RoleCode`
    - `AccountStatus`
    - `ProfileStatus`
    - `VolunteerStatus`
    - `RegionalAdminStatus`
    - `Sex`
    - `GazaLocation`
    - `PassportStatus`
    - `PassportLocation`
    - `DocumentType`
    - `DocumentStatus`
    - `OfferReviewStatus`
    - `AlertStatus`
  - Added final models:
    - `User`
    - `StudentProfile`
    - `VolunteerProfile`
    - `RegionalAdminProfile`
    - `Region`
    - `University`
    - `ConfigOption`
    - `Offer`
    - `OfferRevision`
    - `Document`
    - `Alert`
    - `AlertMessage`
    - `Announcement`
    - `AppConfig`
    - `AuditLog`

### Final Schema Decisions

- Fixed roles are stored directly on `User.roles RoleCode[]`.
- One regional admin belongs to exactly one region through `RegionalAdminProfile.regionId`.
- `Region` remains a real configurable master-data table because it owns relationships and access boundaries.
- `University` belongs to `Region`.
- `Offer` belongs directly to the student `User` through `studentUserId`.
- `Offer` keeps required `regionId` and optional `universityId`.
- `Offer.universityName` remains as fallback text for universities not yet in master data.
- `ConfigOption` stores simple editable dropdown values.
- `AppConfig` stores structured settings such as offer financial rules.
- `Document` remains the central private file metadata table.
- `AuditLog` remains generic instead of creating entity-specific activity-log tables.

### Migrations

- `prisma/migrations/20260516120739_initial_auth/migration.sql`
  - Added initial auth/user/profile/region/audit baseline.

- `prisma/migrations/20260516123458_student_profile_documents/migration.sql`
  - Added student profile fields, document enums, and document metadata table.

- `prisma/migrations/20260516145447_offer_management/migration.sql`
  - Added offer management, offer document types, offer revisions, and app config.

- `prisma/migrations/20260516195827_schema_update/migration.sql`
  - Historical schema update migration present in the current migration history.

- `prisma/migrations/20260517000000_simplified_target_schema/migration.sql`
  - Migrated from the early schema to the simplified final schema.
  - Backfilled `User.roles` from previous role records.
  - Backfilled `RegionalAdminProfile` from previous regional assignment records.
  - Backfilled `Offer.studentUserId` from previous profile-linked offers.
  - Added `University`, `ConfigOption`, `Alert`, `AlertMessage`, and `Announcement`.
  - Dropped old role and regional-assignment tables after data was copied.

### Seed Scripts

- `prisma/seed.ts`
  - Seeds configured regions.
  - Seeds offer financial rules.
  - Seeds config options for course fields, course levels, offer types, alert types, and announcement categories.

- `prisma/seed-admin.ts`
  - Seeds development Master Admin:
    - `admin@example.com`
    - `AdminPassword123!`

- `prisma/seed-regional-admin.ts`
  - Seeds development UK Regional Admin:
    - `regional.uk@example.com`
    - `RegionalPassword123!`

## 2026-05-16 / 2026-05-17 - Auth APIs

### Files Added

- `src/modules/auth/auth.validation.ts`
- `src/modules/auth/token.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.routes.ts`

### Behavior Added

- Student registration.
- Volunteer registration.
- Login with httpOnly JWT cookie.
- Logout.
- Current user lookup.
- Role payloads sourced from `User.roles`.

### Routes Added

- `POST /api/auth/register/student`
- `POST /api/auth/register/volunteer`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## 2026-05-16 / 2026-05-17 - Student Profile Review APIs

### Files Added

- `src/modules/student-profile/student-profile.validation.ts`
- `src/modules/student-profile/student-profile.service.ts`
- `src/modules/student-profile/student-profile.controller.ts`
- `src/modules/student-profile/student-profile.routes.ts`
- `src/modules/admin/student-profiles/admin-student-profile.validation.ts`
- `src/modules/admin/student-profiles/admin-student-profile.service.ts`
- `src/modules/admin/student-profiles/admin-student-profile.controller.ts`
- `src/modules/admin/student-profiles/admin-student-profile.routes.ts`

### Behavior Added

- Student profile read/update/submit.
- Edit allowed only in `draft` or `changes_requested`.
- Submission validates required profile fields and required documents.
- Master Admin list/detail/review for student profiles.
- Single profile review endpoint with `approved`, `changes_requested`, and `rejected`.
- Audit logs for profile submission and review actions.

### Routes Added

- `GET /api/student/profile/me`
- `PATCH /api/student/profile/me`
- `POST /api/student/profile/me/submit`
- `GET /api/admin/student-profiles`
- `GET /api/admin/student-profiles/:id`
- `PATCH /api/admin/student-profiles/:id/review`

## 2026-05-16 / 2026-05-17 - Document Upload APIs

### Files Added

- `src/modules/documents/document.constants.ts`
- `src/modules/documents/upload.middleware.ts`
- `src/modules/documents/document.validation.ts`
- `src/modules/documents/document.service.ts`
- `src/modules/documents/document.controller.ts`
- `src/modules/documents/document.routes.ts`

### Behavior Added

- Local private uploads under `uploads/private/`.
- File type validation for PDF/JPEG/JPG/PNG.
- 5MB max upload size.
- Profile document support:
  - `national_id`
  - `passport`
  - `moi_letter`
  - `consent_form`
- Offer document support:
  - `offer_letter`
  - `scholarship_letter`
- Re-upload supersedes previous active document of the same type/scope.
- Protected document download for owner or Master Admin.

### Routes Added

- `POST /api/documents`
- `GET /api/documents/:id/download`

## 2026-05-16 / 2026-05-17 - Offer Management APIs

### Files Added

- `src/modules/offers/offer.validation.ts`
- `src/modules/offers/offer-financial.ts`
- `src/modules/offers/offer.service.ts`
- `src/modules/offers/student-offer.controller.ts`
- `src/modules/offers/student-offer.routes.ts`
- `src/modules/offers/admin-offer.controller.ts`
- `src/modules/offers/admin-offer.routes.ts`

### Behavior Added

- Student offer list/detail/create/update/delete/submit.
- Offer APIs require approved student profile.
- Offer region can be resolved by `universityId`, `regionId`, or `universityCountry`.
- Offer document required before submit.
- Scholarship document required when scholarship is selected.
- Approved-offer edits create `OfferRevision` and return the offer to review.
- Backend financial summary calculation using configurable financial rules.
- Master Admin can review all offers.
- Regional Admin can review offers only for their `RegionalAdminProfile.regionId`.
- Approval marks the student's profile as having a verified offer.
- Audit logs for offer submit, removal, approved-offer edit, and admin review.

### Routes Added

- `GET /api/student/offers`
- `POST /api/student/offers`
- `GET /api/student/offers/:id`
- `PATCH /api/student/offers/:id`
- `DELETE /api/student/offers/:id`
- `POST /api/student/offers/:id/submit`
- `GET /api/admin/offers`
- `GET /api/admin/offers/:id`
- `PATCH /api/admin/offers/:id/review`

## 2026-05-17 - Config And Master Data APIs

### Files Added

- `src/modules/config/config.validation.ts`
- `src/modules/config/config.service.ts`
- `src/modules/config/config.controller.ts`
- `src/modules/config/config.routes.ts`

### Behavior Added

- Public read APIs for:
  - active regions
  - active universities
  - active config options by group
- Master Admin write APIs for:
  - config options
  - regions
  - universities
- Deactivation uses `isActive=false` and `deletedAt` instead of hard delete.

### Routes Added

- `GET /api/config/regions`
- `GET /api/config/universities`
- `GET /api/config/options`
- `POST /api/admin/config/options`
- `PATCH /api/admin/config/options/:id`
- `DELETE /api/admin/config/options/:id`
- `POST /api/admin/config/regions`
- `PATCH /api/admin/config/regions/:id`
- `DELETE /api/admin/config/regions/:id`
- `POST /api/admin/config/universities`
- `PATCH /api/admin/config/universities/:id`
- `DELETE /api/admin/config/universities/:id`

## 2026-05-16 / 2026-05-17 - Developer Documentation

### Documentation Added

- `documentation/README.md`
- `documentation/setup.md`
- `documentation/architecture.md`
- `documentation/api.md`
- `documentation/models.md`
- `documentation/flows.md`
- `documentation/auth-rbac.md`
- `documentation/file-uploads.md`
- `documentation/testing.md`
- `documentation/database-schema.md`
- `documentation/database-erd.svg`

### Documentation Coverage

- Local setup.
- Architecture overview.
- API routes and curl examples.
- Database schema and grouped ERD.
- Auth/RBAC.
- File uploads.
- User/system flows.
- Manual testing.

## Current Verification Status

- `corepack pnpm prisma validate` passed.
- `corepack pnpm prisma migrate deploy` passed for the simplified schema migration.
- `corepack pnpm prisma:generate` passed.
- `corepack pnpm prisma:seed` passed.
- `corepack pnpm prisma:seed:admin` passed.
- `corepack pnpm prisma:seed:regional-admin` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm build` passed.

## Known Non-Committed Local Files

These files should not be committed unless deliberately needed:

- `admin-debug.cookies`
- `error.txt`

`Simplified_Solution.md` is optional reference material. Commit it only if the team wants to keep that external planning reference in the repo.
