# Gaza40Plus RBAC Skill

This Anthropic Skill is designed to document and enforce security policies, user roles, permission models, and data ownership constraints for the Gaza40Plus platform.

## Structure

### Core

* `SKILL.md` — Defines when the RBAC skill should be triggered, how the AI should reason about authorization requests, and the development workflow for permission-related tasks.
* `README.md` — Overview of the RBAC skill, its purpose, structure, and maintenance guidelines.

### RBAC Documentation

* `rbac/roles.md` — Canonical definition of Gaza40Plus system roles, responsibilities, scopes, and typical workflows.
* `rbac/permission-model.md` — Describes the authorization decision model, including authentication, ownership, assignment, regional scope, resource type, business rules, and backend enforcement.
* `rbac/document-access.md` — Defines document access policies for each role and document type, along with the platform's document security principles.
* `rbac/ownership-rules.md` — Explains ownership, mentor assignment, regional scope, and global administration concepts that determine access eligibility.
* `rbac/common-scenarios.md` — Collection of common authorization scenarios demonstrating how RBAC decisions should be evaluated.
* `rbac/security-principles.md` — Core security principles that guide every authorization decision across the platform.
* `rbac/implementation-guidelines.md` — Engineering guidelines for implementing RBAC safely, consistently, and without duplicating authorization logic.
* `rbac/regression-checklist.md` — Security and regression checklist to review before merging authorization-related changes.

## Usage

Use this skill whenever working on features related to:

* Authentication
* Authorization
* Role-Based Access Control (RBAC)
* Ownership validation
* Mentor assignment
* Regional access
* Document preview, download, upload, or deletion
* Approval workflows
* Dashboard visibility
* Protected API endpoints
* Security reviews
* Permission debugging

## Maintenance

This skill serves as the authoritative business reference for authorization within Gaza40Plus.

When RBAC behavior changes:

1. Update the relevant documentation in the `rbac/` directory.
2. Review `document-access.md` if document permissions change.
3. Review `roles.md` if responsibilities or scopes change.
4. Update `common-scenarios.md` with new authorization flows where applicable.
5. Review `regression-checklist.md` to ensure new security cases are covered.
6. Keep this documentation synchronized with the platform's actual business rules.



## Refinement
Populate the placeholder documents incrementally during feature updates or specific security configuration reviews.
