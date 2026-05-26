# MVP Gaps And Known Limits

This document tracks what is not fully production-ready yet. `vision/requirements.md` remains the source of truth.

## Intentional MVP Gaps

### Local File Storage

Current state:
- Files are stored under local private upload storage.
- Files are not exposed through public static routes.

Why this matters:
- Local files can be lost on hosted platforms during redeploy/restart.

Before production:
- Move files to S3, Supabase Storage, Cloudflare R2, or another private object store.
- Keep protected download authorization in the API.

### Email Deliverability

Current state:
- Resend email sending is best-effort.
- Email failures do not block profile, offer, or query workflows.
- Password reset and email verification links exist.

Why this matters:
- Resend test sender has recipient restrictions.
- Real sending needs a verified domain.

Before production:
- Verify a sending domain.
- Set production `EMAIL_FROM`.
- Decide whether email verification should block profile submission or login.

### CSRF And Session Hardening

Current state:
- Auth uses httpOnly cookie JWT.
- Cookie uses `SameSite=Lax`.
- Rate limiting is enabled.

Deferred:
- CSRF token middleware.
- Account lockout.
- Password reset abuse throttling beyond route rate limiting.
- Redis/distributed rate limiting.

### University And Scholarship Process Tabs

Current state:
- Not implemented as APIs.

Why:
- SRS explicitly says these can be made later and are not urgent.

Before building:
- Confirm content structure with the program team.
- Avoid building a process CMS before actual content requirements are clear.

### Frontend Bilingual UI

Current state:
- Backend has some Arabic-capable config fields such as `labelAr`.
- No frontend RTL/LTR implementation exists in this backend repo.

Before full MVP release:
- Implement English/Arabic language toggle in frontend.
- Apply RTL layout when Arabic is selected.

## Production Readiness Checklist

- Rotate any secrets that were pasted into chat or shared outside `.env`.
- Commit Prisma migrations intentionally.
- Commit developer documentation intentionally.
- Use private object storage for uploaded files.
- Verify Resend sending domain.
- Set `NODE_ENV=production`.
- Set `COOKIE_SECURE=true`.
- Set production `CORS_ORIGIN`.
- Set production `FRONTEND_URL`.
- Run full Postman happy path.
- Confirm database backup/export policy.
- Confirm who can access Master Admin credentials.

## Current Backend MVP Confidence

Approximate status: 93-94% API-complete.

Reason:
- Core auth, profile, offers, documents, admin review, regional scoping, queries, announcements, exports, dashboards, audit logs, and email hooks exist.
- Main remaining gaps are hardening and deployment concerns, not large missing backend modules.
