# Gaza40-Student-Portal Backend Architecture

This document describes the architectural layout of the `Gaza40-Student-Portal` backend repository. The application is designed as a modular Express server structured around domain-driven feature modules.

---

## 1. Major Modules
All core feature domains are isolated within self-contained modules located in the `src/modules/` directory:

* **`admin`**: Administrative control, configuration updates, and management features.
* **`announcements`**: Broadcasts, notices, and portal-wide system announcements.
* **`auth`**: Authentication workflows, registration, token generation (`token.ts`), and password reset logic.
* **`chat`**: Real-time message storage, conversation threads, and direct/group chat systems.
* **`config`**: Module-specific or application-wide runtime configurations.
* **`csv-generator`**: Data aggregation, formatting, and file export helpers.
* **`dashboard`**: Main portal metrics and administrative statistics aggregation.
* **`documents`**: Document metadata, upload queues, and file view routing.
* **`health`**: Monitoring and service ping endpoints.
* **`notifications`**: User notifications, push dispatch, and socket events.
* **`offers`**: Management of student opportunities, academic offers, or job postings.
* **`queries`**: Support tickets, query lifecycles, and resolution comments.
* **`student-profile`**: Personal profile data, academic details, and resume files.

---

## 2. Shared Directories
Generic logic, utilities, templates, and configurations that are shared globally across multiple modules reside in:

* **`src/shared/`**:
  * Shared wrappers for files, auditing, and events.
  * Common utility modules (e.g., storage helpers, HTTP response wrappers).
  * Email sending triggers and dynamic templates.
  * General validation utilities.

---

## 3. Middleware Location
Global and route-level Express interceptors are grouped in a dedicated directory:

* **`src/middleware/`**:
  * `auth.middleware.ts`: JWT verification, session checks, and role enforcement.
  * `csrf.middleware.ts`: Security middleware protecting endpoints from cross-site request forgery.
  * `error.middleware.ts`: Central Express error handling and status code formatting.
  * `rate-limit.middleware.ts`: Rate limiting to prevent API abuse.

---

## 4. Routes Location
Routing endpoints are decentralized and declared directly inside their corresponding feature module:

* **`src/modules/<module_name>/<module_name>.routes.ts`** (e.g., `src/modules/auth/auth.routes.ts`)
  * Maps routes (HTTP verbs + path) to specific controller handlers.
  * Binds validation schema middleware and authorization guards locally to individual endpoints.

---

## 5. Prisma Location
Database schema definitions and client instantiations are separated into root-level and source-level locations:

* **`prisma/`** (Root Level):
  * `prisma/schema.prisma`: The single source of truth for the database schema, models, relations, and generators.
  * `prisma/migrations/`: Auto-generated SQL schema migrations.
  * `prisma/seed.ts` & helper seeds: Database seed scripts.
* **`src/db/`** (Source Level):
  * `src/db/prisma.ts`: Initializes and exports the shared global Prisma Client instance.

---

## 6. Services Location
Services containing business logic and queries reside inside their respective feature modules:

* **`src/modules/<module_name>/<module_name>.service.ts`** (e.g., `src/modules/auth/auth.service.ts`)
  * Houses database query logic (calling Prisma methods).
  * Executes core domain rules, computations, and coordinates external calls.

---

## 7. Validation Location
Validation rules for API requests are placed inside their respective feature modules:

* **`src/modules/<module_name>/<module_name>.validation.ts`** (e.g., `src/modules/auth/auth.validation.ts`)
  * Contains request schemas defining required types, regex, and bounds.
  * Run as Express middleware before controller handlers to enforce payload constraints.
