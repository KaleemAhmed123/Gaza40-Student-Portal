# Developer Documentation

This folder is for practical developer-facing documentation. Keep `plans/` for planning, audits, and decision history. Keep `vision/` for product source documents.

## Recommended Reading Order

1. `../vision/requirements.md` - source of truth for MVP behavior.
2. `../ENGINEERING.md` - coding and simplicity rules.
3. `setup.md` - local setup and commands.
4. `architecture.md` - current backend/frontend architecture.
5. `api.md` - API routes and request/response notes.
6. `database-schema.md` - complete schema comparison, current tables, and simple target tables.
7. `database-erd.svg` - visual relationship diagram for current and recommended next tables.
8. `models.md` - database models and important enums.
9. `flows.md` - user and system flows.
10. `auth-rbac.md` - authentication and access control rules.
11. `file-uploads.md` - local/private upload behavior.
12. `testing.md` - manual and automated test checklist.

## Documentation Rules

- Keep docs short and accurate.
- Update docs in the same PR/turn as code changes.
- Do not copy full code into docs.
- Prefer route names, model names, field names, behavior, and examples.
- If a doc becomes large, split by feature instead of making one giant file.
