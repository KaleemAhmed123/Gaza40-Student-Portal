# Gaza40Plus RBAC Security Principles

These principles guide every authorization decision within Gaza40Plus.

They should be considered mandatory engineering rules.

---

# Principle 1

## Backend is the Source of Truth

Authorization decisions must always be enforced by the backend.

Frontend logic exists only for user experience.

---

# Principle 2

## Never Trust the Frontend

Hidden buttons, disabled controls, and protected routes improve usability but do not provide security.

Every backend endpoint must independently validate permissions.

---

# Principle 3

## Never Trust Client-Supplied Roles

User roles must always be derived from the authenticated session.

Never rely on roles submitted through request payloads or client state.

---

# Principle 4

## Verify Authentication First

Authorization must never execute before authentication succeeds.

Unauthenticated requests must be rejected immediately.

---

# Principle 5

## Verify Ownership Before Permissions

A role does not automatically imply eligibility.

Ownership, assignment, or regional scope must first be validated.

---

# Principle 6

## Least Privilege

Users receive only the permissions required to perform their responsibilities.

When uncertain, deny access until permissions are explicitly defined.

---

# Principle 7

## Deny by Default

Resources should remain inaccessible unless access has been explicitly granted.

Implicit permissions should never exist.

---

# Principle 8

## Defense in Depth

Authorization should be enforced at multiple layers where appropriate.

Examples include:

* Route guards
* Middleware
* Services
* Database query filters

---

# Principle 9

## Protect Sensitive Documents

Identity documents require stricter protection than operational documents.

Sensitive documents must never become accessible through indirect relationships.

---

# Principle 10

## Never Expose Storage Directly

Private storage locations should never become publicly accessible.

All previews and downloads should pass through authorization before access is granted.

---

# Principle 11

## Fail Securely

When authorization cannot be determined reliably, deny access.

Never grant permissions because of missing data or unexpected states.

---

# Principle 12

## Keep Documentation Synchronized

Whenever RBAC changes:

* update documentation
* update permission matrices
* update regression tests
* review affected endpoints

Documentation should evolve together with the implementation.
