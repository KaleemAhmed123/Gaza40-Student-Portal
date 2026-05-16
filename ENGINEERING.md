# Engineering Guide

Codex must read this before coding. Keep the project simple, readable, reusable, and aligned with `vision/requirements.md`.

## Core Rules
- `vision/requirements.md` is the source of truth.
- Do not over-engineer, but keep important flows strong, secure, and robust.
- Discuss tech, libraries, architecture, naming, and abstractions with the user before deciding.
- Prefer boring, clear code over clever code.
- Solve the problem efficiently, but readability matters more than saving lines.

## Simplicity
- Keep files and functions focused.
- Avoid deep nesting; use simple control flow.
- Do not create complex patterns unless the requirement truly needs them.
- Avoid generic systems, workflow engines, or enterprise-style abstractions.

## Reuse
- Create helpers only when logic repeats or a helper clearly improves readability.
- Keep helpers specific and easy to name.
- Avoid large generic `utils` files.
- Prefer feature-level helpers before shared helpers.

## Naming
- Use clear, business-focused names.
- Avoid vague names like `data`, `item`, `obj`, `temp`, or `result` when a better name exists.
- Use constants/enums for roles, statuses, categories, and file limits.

## Security
- Treat student data, documents, Gaza location, emergency contacts, financial data, and messages as sensitive.
- Enforce RBAC and regional access on the server.
- Never expose public document URLs.
- Do not log sensitive personal data.

## Testing
- Test critical business rules first: eligibility, consent, review locks, financial calculations, RBAC, regional isolation, and uploads.
- Add regression tests for fixed bugs when practical.

## Avoid
- Scope drift.
- Unapproved dependencies.
- Premature abstractions.
- Real-time systems unless approved.
- Post-MVP features during MVP work.
