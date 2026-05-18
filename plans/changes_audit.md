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
    - `QueryStatus`
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
    - `Query`
    - `QueryMessage`
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
  - Added `University`, `ConfigOption`, query/ticket tables, and `Announcement`.
  - Dropped old role and regional-assignment tables after data was copied.

### Seed Scripts

- `prisma/seed.ts`
  - Seeds configured regions.
  - Seeds offer financial rules.
  - Seeds config options for course fields, course levels, offer types, query categories, and announcement categories.

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

## 2026-05-17 - Queries / Ticketing APIs

### Files Added

- `src/modules/queries/query.validation.ts`
- `src/modules/queries/query.service.ts`
- `src/modules/queries/student-query.controller.ts`
- `src/modules/queries/admin-query.controller.ts`
- `src/modules/queries/mentor-query.controller.ts`
- `src/modules/queries/query.routes.ts`
- `src/shared/email.ts`

### Behavior Added

- Student-created in-app queries/tickets.
- Config-driven query categories through `query_category`.
- Query messages as chronological ticket replies, not threaded comments.
- Master Admin access to all queries.
- Regional Admin access only to queries linked to their region.
- Admin assignment of queries to active mentors.
- Mentor access only to assigned queries.
- Admin or assigned mentor can resolve a query.
- Resolved queries are read-only.
- Optional Resend email notifications are best-effort and never block query creation or replies.
- Offer-review alerting remains separate and deferred.

### Routes Added

- `POST /api/queries`
- `GET /api/queries/my`
- `GET /api/queries/:id`
- `POST /api/queries/:id/messages`
- `GET /api/admin/queries`
- `GET /api/admin/queries/:id`
- `PATCH /api/admin/queries/:id/assign`
- `POST /api/admin/queries/:id/messages`
- `PATCH /api/admin/queries/:id/resolve`
- `GET /api/mentor/queries`
- `GET /api/mentor/queries/:id`
- `POST /api/mentor/queries/:id/messages`
- `PATCH /api/mentor/queries/:id/resolve`

## 2026-05-17 - Announcements APIs

### Files Added

- `src/modules/announcements/announcement.validation.ts`
- `src/modules/announcements/announcement.service.ts`
- `src/modules/announcements/announcement.controller.ts`
- `src/modules/announcements/announcement.routes.ts`

### Behavior Added

- Global published announcements for all authenticated roles.
- Master Admin list/detail/create/update/delete for announcements.
- Category validation against `announcement_category`.
- Publish/unpublish support through `isPublished`.
- Soft delete with `deletedAt`.
- Audit logs for create, update, and delete actions.

### Routes Added

- `GET /api/announcements`
- `GET /api/announcements/:id`
- `GET /api/admin/announcements`
- `POST /api/admin/announcements`
- `GET /api/admin/announcements/:id`
- `PATCH /api/admin/announcements/:id`
- `DELETE /api/admin/announcements/:id`

## 2026-05-17 - Light Security Hardening

### Files Added

- `src/middleware/rate-limit.middleware.ts`

### Behavior Added

- Added `express-rate-limit`.
- Added general `/api` rate limiting.
- Added stricter auth route rate limiting.
- Added document upload route rate limiting.
- Added environment defaults for rate-limit windows and limits.
- Documented safe logging rules.
- Documented deferred CSRF, email verification, account lockout, password reset, and distributed rate limiting.

## 2026-05-17 - Admin Students Grid API

### Files Added

- `src/modules/admin/students/admin-student-grid.validation.ts`
- `src/modules/admin/students/admin-student-grid.service.ts`
- `src/modules/admin/students/admin-student-grid.controller.ts`
- `src/modules/admin/students/admin-student-grid.routes.ts`

### Behavior Added

- Added role-aware `GET /api/admin/students`.
- Master Admin can list all registered students with profile and offer summary fields.
- Master Admin can filter by profile status, passport status, Gaza location, consent, verified offer, and search text.
- Regional Admin can list only students with offers in the admin's assigned offer/university region.
- Kept `locationInGaza` separate from offer/university `Region` for access control.
- Added pagination with `page` and `pageSize`.

## 2026-05-17 - Admin Volunteers Grid API

### Files Added

- `src/modules/admin/volunteers/admin-volunteer-grid.validation.ts`
- `src/modules/admin/volunteers/admin-volunteer-grid.service.ts`
- `src/modules/admin/volunteers/admin-volunteer-grid.controller.ts`
- `src/modules/admin/volunteers/admin-volunteer-grid.routes.ts`

### Behavior Added

- Added role-aware `GET /api/admin/volunteers`.
- Master Admin can list all registered volunteers with status, roles, and profile summary fields.
- Master Admin can filter by volunteer status, role, preferred region, and search text.
- Regional Admin can list volunteers whose `preferredRegionId` matches the admin's assigned offer/university region.
- Added pagination with `page` and `pageSize`.

## 2026-05-18 - Admin Offers Grid Improvements

### Behavior Updated

- Extended existing `GET /api/admin/offers`; no new route added.
- Added filters for offer type, university name, course field, course level, funding type, scholarship flag, search, pagination, region, and status.
- Added response summary counts by offer type, university, funding type, and review status.
- Kept Master Admin access to all offers.
- Kept Regional Admin scoped to `RegionalAdminProfile.regionId`.
- Regional Admin cannot request another region's offers.

## 2026-05-18 - Postman Collection Cleanup

### Developer Testing Updated

- Updated `Gaza40+ API.postman_collection.json` for easier developer testing.
- Added role-specific auth requests that capture httpOnly auth cookies into collection variables.
- Organized new grid requests into `13 Admin Students Grid` and `14 Admin Volunteers Grid`.
- Expanded `07 Admin Offer Review` with current filters, summaries, pagination, and review actions.
- Aligned Query/Ticketing payloads with the current API fields: `queryType`, `title`, and `assignedToUserId`.
- Added negative/security requests for invalid admin offer and volunteer grid access cases.
- Added `scripts/update-postman-collection.ps1` so collection changes can be regenerated without manual Postman editing.

## 2026-05-18 - CSV Export API Slice

### Behavior Added

- Added `GET /api/admin/students/export`.
- Added `GET /api/admin/volunteers/export`.
- Added `GET /api/admin/offers/export`.
- Exports reuse the existing grid filters and server-side regional scoping.
- Export responses return `text/csv` with attachment filenames.
- Export actions write audit logs with actor, scope, filters, and row count.
- Updated API docs, RBAC docs, flows docs, and Postman collection requests.

## 2026-05-18 - Offer Revision Visibility And Volunteer Assignment

### Behavior Added

- Admin offer list now includes `latestRevision` when an approved offer was edited and sent back to review.
- Admin offer detail now includes full `revisions` with `changedFields` and before/after values for field highlighting.
- Added `GET /api/admin/offers/:id/revisions` for direct change-log access.
- Added `PATCH /api/admin/volunteers/:id/assignment`.
- Master Admin can update volunteer preferred region, status, and mentor role enablement.
- Regional Admin can update only volunteers already assigned to their own region and cannot grant privileged roles.
- Volunteer assignment writes audit logs.

## 2026-05-18 - Admin Audit Log API

### Behavior Added

- Added `GET /api/admin/audit-logs`.
- Added `GET /api/admin/audit-logs/:id`.
- Supports filters for action, entity type, entity id, actor, date range, and pagination.
- Restricted audit-log visibility to active Master Admins only for MVP.
- Updated API docs, RBAC docs, flows docs, and Postman collection requests.

## 2026-05-18 - Dashboard Summary APIs

### Behavior Added

- Added `GET /api/student/dashboard`.
- Added `GET /api/admin/dashboard`.
- Added `GET /api/mentor/dashboard`.
- Student dashboard returns profile status, offer/query counts, recent offers, recent queries, and latest announcements.
- Admin dashboard returns lightweight counts and recent items; Regional Admin results are scoped to assigned offer/university region.
- Mentor dashboard returns assigned query counts and recent assigned queries.
- Detailed filtering and exports remain in the existing grid APIs.

## 2026-05-18 - Review Email Notifications And Document Download Audit

### Behavior Added

- Added best-effort review email notifications through the existing Resend-backed email utility.
- Profile submission now notifies active Master Admins when `RESEND_API_KEY` is configured.
- Offer submission and approved-offer edits now notify active Regional Admins for the offer region.
- If an offer region has no active Regional Admin, active Master Admins are notified instead.
- Email failures are logged and never block profile or offer workflows.
- Protected document downloads now write `document_downloaded` audit logs.

## 2026-05-18 - Temporary Profile Document Gate Relaxed

### Behavior Changed

- Temporarily disabled required profile-document checks during `POST /api/student/profile/me/submit` to speed manual API testing.
- Field validation still runs.
- Upload file type and size validation remains enabled.
- Re-enable document checks before production because the SRS requires consent and required documents before profile submission.

## 2026-05-19 - Password Reset And Email Verification

### Behavior Added

- Added `AuthToken` model and `AuthTokenType` enum.
- Added `POST /api/auth/forgot-password`.
- Added `POST /api/auth/reset-password`.
- Added `POST /api/auth/send-verification-email`.
- Added `POST /api/auth/verify-email`.
- Auth tokens are stored hashed, expire, and are single-use.
- Forgot-password response is generic to avoid email enumeration.
- Added `FRONTEND_URL` env variable for email links.

## 2026-05-19 - Mentor Query Acceptance

### Behavior Added

- Added `acceptedAt` to queries.
- Added `PATCH /api/mentor/queries/:id/accept`.
- Assigned mentors can accept only their own assigned queries.
- Accepting a query writes a `query_accepted` audit log.
- Kept the workflow simple: no extra query status was added.

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

- `corepack pnpm prisma:generate` passed after the Query model rename.
- `corepack pnpm prisma:migrate` currently fails during shadow-database replay because older migration `20260516195827_schema_update` references the earlier `Alert` table before the later simplified schema migration creates it.
- `corepack pnpm prisma migrate deploy` passed; the real database has no pending migrations.
- `corepack pnpm prisma:seed` passed and seeds `query_category`.
- `corepack pnpm lint` passed.
- `corepack pnpm build` passed.
- `corepack pnpm lint` passed after the Announcements API slice.
- `corepack pnpm build` passed after the Announcements API slice.
- `corepack pnpm lint` passed after the light security hardening slice.
- `corepack pnpm build` passed after the light security hardening slice.
- `corepack pnpm lint` passed after the Admin Students Grid API slice.
- `corepack pnpm build` passed after the Admin Students Grid API slice.
- `corepack pnpm lint` passed after the Admin Volunteers Grid API slice.
- `corepack pnpm build` passed after the Admin Volunteers Grid API slice.
- `corepack pnpm lint` passed after Admin Offers Grid improvements.
- `corepack pnpm build` passed after Admin Offers Grid improvements.

Earlier verification before the Query slice:

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
