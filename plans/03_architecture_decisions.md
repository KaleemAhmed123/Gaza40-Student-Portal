# Architecture Decision Records (ADRs)

These are current preferred directions, not blind final decisions. `vision/requirements.md` remains the source of truth, and major implementation choices should still be discussed before coding.

## ADR-1: Frontend Framework

- **Status**: Preferred direction
- **Context**: The SRS needs bilingual RTL/LTR pages, student/admin/mentor dashboards, forms, uploads, and a few public/auth pages where SEO may matter.
- **Options Considered**:
  - **Next.js + TypeScript:** Better for SEO-capable public pages, routing, layouts, and production React structure.
  - **React + Vite + TypeScript:** Simpler SPA, but weaker for public SEO unless extra work is added.
- **Decision**: Use **Next.js + TypeScript** for the frontend.
- **Consequences**: Good routing and public-page SEO support. Avoid using Next API routes as the main backend because the project will use Express APIs.

## ADR-2: Frontend Data Fetching

- **Status**: Preferred direction
- **Context**: Dashboards need smooth fetching, caching, refetching, mutations, loading states, and error states.
- **Options Considered**:
  - **TanStack Query:** Strong fit for client-side server-state management.
  - **Manual fetch/useEffect:** Simple initially, but messy across many grids/forms.
  - **Next server actions/API routes:** Not aligned with the chosen separate Express backend.
- **Decision**: Use **TanStack Query** for frontend data fetching and mutations.
- **Consequences**: Cleaner dashboard UX and cache invalidation. Requires a consistent API response/error shape from Express.

## ADR-3: Backend Framework

- **Status**: Started
- **Context**: The backend must handle auth, RBAC, regional access, uploads, CSV exports, review workflows, alerts, and admin APIs.
- **Options Considered**:
  - **Express + TypeScript:** Familiar, simple, flexible, and enough for MVP.
  - **NestJS:** More structure, but likely too heavy right now.
  - **Next API routes:** Convenient, but mixes concerns and is not preferred for this backend-heavy portal.
- **Decision**: Use **Node.js + Express + TypeScript**. Initial API scaffold has been created.
- **Consequences**: Clear backend ownership and familiar Node patterns. We must keep route/controller/service structure disciplined without overbuilding.

## ADR-4: Database

- **Status**: Started
- **Context**: The system has relational data: users, roles, regions, students, offers, documents, alerts, assignments, exports, and audit logs.
- **Options Considered**:
  - **PostgreSQL:** Best fit for relationships, filtering, exports, and regional access.
  - **MongoDB:** Possible, but access-control queries and reporting would be easier to get wrong.
- **Decision**: Use **PostgreSQL**, currently configured through Supabase Postgres.
- **Consequences**: Cleaner relational model and safer access queries. We should choose Postgres because it fits the data, not only because of free-tier storage.

## ADR-5: ORM / Database Client

- **Status**: Started
- **Context**: The backend needs type-safe queries, migrations, and readable data access.
- **Options Considered**:
  - **Prisma:** Good TypeScript support, migrations, and clear schema.
  - **Drizzle:** Lightweight and SQL-oriented, but requires more SQL comfort.
  - **Raw SQL only:** Maximum control, but slower and easier to make inconsistent.
- **Decision**: Use **Prisma** with PostgreSQL. Initial migration exists for auth/roles/regions/profile foundations.
- **Consequences**: Faster development and safer types. Avoid hiding business logic inside ORM abstractions.

## ADR-6: Authentication Strategy

- **Status**: Started
- **Context**: The app needs role-aware auth for students, mentors, regional admins, and master admins.
- **Options Considered**:
  - **JWT in httpOnly cookies:** Works well with separate frontend/backend and avoids localStorage token risk.
  - **Server sessions:** Easier revocation, but more server/session storage concerns.
  - **JWT in localStorage:** Convenient but not acceptable for this sensitive portal.
- **Decision**: Use **short-lived JWT access tokens in httpOnly cookies**, with refresh handling if needed. Do not store JWTs in localStorage. Initial auth endpoints have been scaffolded.
- **Consequences**: Good fit for Next frontend + Express backend. JWT role claims are for convenience only; sensitive admin, region, and file-access routes must still check current DB permissions.

## ADR-7: Authorization / RBAC

- **Status**: Started
- **Context**: Regional Admins must not see other countries' data, and mentors must only see assigned students/alerts.
- **Options Considered**:
  - **Simple server-side RBAC helpers:** Clear and enough for MVP.
  - **JWT-only authorization:** Fast but unsafe if permissions change or regional checks are complex.
  - **External policy engine:** Too heavy for MVP.
- **Decision**: Use **server-side RBAC and regional-scope checks** in Express middleware/services. Initial `requireAuth` and `requireRole` middleware exists; regional-scope checks still need implementation when regional APIs are added.
- **Consequences**: Keeps sensitive data safer. In the future, a permission system can be added without trusting JWT payloads as the only authority.

## ADR-8: File Storage

- **Status**: Started
- **Context**: The SRS requires secure uploads for IDs, passports, consent forms, offer letters, scholarship letters, and MOI letters.
- **Options Considered**:
  - **Local private uploads in development + S3-compatible private bucket in production:** Simple dev flow and proper production security.
  - **Database BLOBs:** Not suitable for many sensitive files.
  - **Public file URLs:** Not acceptable.
- **Decision**: Use **local private uploads for development** and **S3-compatible private object storage in production**. Local private upload support has started for student profile documents.
- **Consequences**: Keeps dev simple while preserving the production design. File access must go through signed URLs after server-side permission checks.

## ADR-9: Notifications / Real-Time

- **Status**: Preferred direction
- **Context**: The SRS needs alerts and communication, but does not clearly require real-time chat.
- **Options Considered**:
  - **Ticket comments + dashboard refresh/polling:** Simple and enough for MVP.
  - **Email/in-app notifications:** Useful, but can be phased.
  - **WebSockets:** Adds complexity and should wait.
- **Decision**: Use **ticket-style comments/messages for MVP**. Defer WebSockets unless explicitly approved.
- **Consequences**: Keeps the MVP focused and reliable. Real-time chat can be added later if actual usage demands it.

## ADR-10: Internationalization (RTL/LTR)

- **Status**: Preferred direction
- **Context**: The SRS requires English, Arabic, a global language toggle, and RTL layout for Arabic.
- **Options Considered**:
  - **Locale files with direction-aware layout:** Maintainable and explicit.
  - **Hard-coded conditionals:** Fast but fragile.
- **Decision**: Use **locale files** and set layout direction with `dir="rtl"` for Arabic and `dir="ltr"` for English.
- **Consequences**: Requires testing both languages on real forms/tables. Avoid duplicating pages for Arabic and English.

## ADR-11: Deployment

- **Status**: Proposed, needs provider decision
- **Context**: The frontend, backend, Postgres database, and private file storage need reliable hosting.
- **Options Considered**:
  - **Managed frontend/backend hosting + Supabase Postgres + S3-compatible storage:** Practical MVP path.
  - **Single VPS:** Cheaper but higher maintenance/security burden.
  - **Full AWS setup:** Powerful but more operational overhead.
- **Decision**: Use managed services where possible. Supabase Postgres is the preferred database direction; final app/storage hosting still needs discussion.
- **Consequences**: Faster launch and less maintenance. Must confirm backups, region, environment variables, and private storage setup before production.

## ADR-12: Styling

- **Status**: Deferred
- **Context**: Current priority is backend architecture and API design.
- **Options Considered**:
  - **Tailwind CSS**
  - **CSS Modules**
  - **Component library**
- **Decision**: Defer styling choice for now.
- **Consequences**: Avoids premature frontend design decisions. Before UI implementation, choose one simple styling approach and document it here.
