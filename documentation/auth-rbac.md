# Auth And RBAC

## Auth Strategy

- JWT access token stored in httpOnly cookie.
- Do not store JWTs in localStorage.
- JWT role claims are convenience hints only.
- Sensitive routes must check the current `User.roles` value and any required profile scope from the database.

## Current Roles

- `student`
- `mentor`
- `regional_admin`
- `master_admin`

## Current Middleware

- `requireAuth`
  - Verifies JWT cookie and attaches `authUser`.

- `requireRole`
  - Checks roles from JWT payload.
  - Acceptable for low-risk route gating.

- `requireActiveDbRole`
  - Should be replaced during the schema-adjustment pass.
  - New sensitive checks should read `User.roles` directly from the database.

## Current Sensitive Actions

- Master Admin student profile review uses DB-backed role checks.
- Document download allows owner or active Master Admin.
- Offer admin list/detail/review checks the database:
  - Master Admin can access all offers.
  - Regional Admin can access only offers in their `RegionalAdminProfile.regionId`.

## Future RBAC Work

- Mentor assigned-student access.
- Export authorization.
- File access audit hardening.
