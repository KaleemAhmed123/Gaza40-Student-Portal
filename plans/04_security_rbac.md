# Security & Access Control Specification

Implementation note: this file started as the MVP security plan. Current implemented behavior is tracked in `documentation/auth-rbac.md`, `documentation/api.md`, and `plans/changes_audit.md`.

This specification is scoped to the MVP in `vision/requirements.md`. Because the platform handles vulnerable-population data, uploaded IDs, passports, emergency contacts, and funding details, server-side access control is mandatory even for the MVP.

## PII & Sensitive Data Inventory

| Data Field | Sensitivity Level | Who Can Read | Who Can Write | Storage Location |
|---|---|---|---|---|
| Email address | High | Student self, assigned admins, assigned mentor only when needed | User self during signup; admins for correction | `users` |
| Password hash | Critical | System only | Auth system only | `users` |
| Full name in English | High | Student, Master Admin, relevant Regional Admin, assigned Mentor | Student before approval; Master Admin correction | `student_profiles` |
| Sex | Medium | Student, Master Admin | Student before approval; Master Admin correction | `student_profiles` |
| Date of birth | High | Student, Master Admin, relevant Regional Admin limited view | Student before approval; Master Admin correction | `student_profiles` |
| Gaza location | High | Student, Master Admin | Student; Master Admin review | `student_profiles` |
| National ID file | Critical | Student, Master Admin only by default | Student upload; Master Admin may request replacement | Private object storage, `documents` metadata |
| Passport status/location | High | Student, Master Admin, relevant Regional Admin if needed for offer/visa | Student; Master Admin review | `student_profiles` |
| Passport file | Critical | Student, Master Admin; Regional Admin only if required for assigned country workflow | Student upload; Master Admin request replacement | Private object storage, `documents` metadata |
| Emergency contact name/phone | Critical | Student, Master Admin, Regional Admin on active query | Student; Master Admin correction | `student_profiles` |
| English proficiency details | Medium | Student, Master Admin | Student; Master Admin correction | `student_profiles`, `documents` |
| Consent form | Critical | Student, Master Admin | Student upload | Private object storage, `documents` metadata |
| Offer details | High | Student, Master Admin, relevant Regional Admin, assigned Mentor if assigned | Student submit/edit; Regional Admin review | `offers` |
| Offer letter file | Critical | Student, Master Admin, relevant Regional Admin, assigned Mentor if assigned | Student upload | Private object storage, `documents` metadata |
| Scholarship details | High | Student, Master Admin, relevant Regional Admin | Student submit/edit; Regional Admin review | `offers` |
| Scholarship letter file | Critical | Student, Master Admin, relevant Regional Admin | Student upload | Private object storage, `documents` metadata |
| Private funding amount/source | High | Student, Master Admin, relevant Regional Admin | Student submit/edit; Regional Admin review | `offers` |
| Alert/query messages | High | Student on own alert, Master Admin, relevant Regional Admin, assigned Mentor | Participants with access | `alerts`, `alert_messages` |
| Export records | High | Master Admin; Regional Admin for own exports | System only | `exports` |
| Audit logs | Critical | Master Admin only | System only | `audit_logs` |

## Role Permission Matrix

| Feature/Action | Student | Mentor/Volunteer | Regional Admin | Master Admin |
|---|---|---|---|---|
| Register as student | Allowed | Denied | Denied | Denied |
| Register as volunteer | Denied | Allowed | Denied | Denied |
| Complete own student profile | Allowed | Denied | Denied | Denied |
| View own profile | Allowed | Denied | Conditional: limited fields if regional offer exists | Allowed |
| Approve/reject student profile | Denied | Denied | Denied | Allowed |
| Upload own documents | Allowed | Denied | Denied | Conditional: admin correction only if approved |
| View National ID document | Own only | Denied | Denied by default | Allowed |
| View passport document | Own only | Denied | Conditional: assigned country workflow | Allowed |
| Add own offer | Allowed after profile approval | Denied | Denied | Conditional: admin support only |
| Edit own offer | Allowed; locks offer for review | Denied | Denied | Conditional: admin correction only |
| Remove own offer | Allowed as soft removal request | Denied | Conditional: approve removal for region | Allowed |
| Review/approve offer | Denied | Conditional: recommendation only if assigned | Allowed for assigned countries | Allowed |
| View all offers | Denied | Denied | Denied | Allowed |
| View regional offers | Own only | Assigned only | Allowed for assigned countries | Allowed |
| View student grid | Own only | Assigned students only | Limited fields for assigned countries | Allowed |
| View volunteer grid | Denied | Own profile only | Allowed for assigned region | Allowed |
| Assign mentor | Denied | Denied | Allowed for assigned region | Allowed |
| Create alert/query | Allowed | Conditional: internal note on assigned ticket | Allowed | Allowed |
| View own alerts | Allowed | Denied unless assigned | Allowed for assigned region | Allowed |
| Accept assigned alert | Denied | Allowed | Denied | Denied |
| Mark alert resolved | Conditional: can request/reopen | Resolution submitted only | Allowed for assigned region | Allowed |
| Create announcement | Denied | Tier 2 draft only | Tier 2 draft only | Allowed |
| Publish global announcement | Denied | Denied | Denied in MVP | Allowed |
| Edit/delete announcement | Denied | Denied | Denied in MVP | Allowed |
| Export students CSV | Denied | Denied | Conditional: limited regional fields | Allowed |
| Export offers CSV | Denied | Denied | Conditional: assigned countries only | Allowed |
| Assign roles | Denied | Denied | Conditional: mentor roles in assigned region if approved | Allowed |
| Manage regions | Denied | Denied | Denied | Allowed |
| View audit logs | Denied | Denied | Denied | Allowed |

## Data Isolation Rules

1. Master Admin can access all student, volunteer, offer, alert, announcement, export, and audit data.
2. Regional Admin access is scoped by `admin_regions`.
3. Regional Admin can see offers where `offers.region_id` is one of their assigned regions.
4. Regional Admin can see limited student identity/contact fields only for students who have offers in their assigned regions.
5. Regional Admin must not see full student profile, National ID, consent form, or unrelated offers outside assigned regions.
6. If a student has offers in multiple regions, each Regional Admin sees only the offer(s) in their assigned country and the minimum student fields required by the SRS.
7. Mentor can see only alerts and student tiles explicitly assigned to them.
8. Mentor cannot browse the student database.
9. Student can see and edit only their own profile, own documents, own offers, and own alerts.
10. File access must be checked through application authorization before generating a signed URL.
11. CSV exports must apply the same RBAC and regional filters as the dashboard view.
12. Soft-deleted records must be hidden from normal dashboards but preserved for Master Admin audit needs.

## File Upload Security

- Allow only `.pdf`, `.jpeg`, `.jpg`, and `.png` as required by the SRS.
- Enforce MIME type and extension validation on both client and server.
- Enforce 5MB maximum file size per file for MVP, matching the SRS example and low-bandwidth context.
- Store all files in private object storage. No public buckets.
- Store only metadata and private storage keys in the database.
- Generate short-lived signed URLs only after server-side RBAC checks.
- Use random storage keys; never trust or expose original filenames as storage paths.
- Scan files for malware if the hosting/provider setup supports it. If not available for MVP, document it as a launch risk.
- Prevent executable content from being served inline. Prefer download disposition for risky MIME types.
- Keep replaced files as `superseded` rather than overwriting them.
- Log sensitive file access for admin roles.

## Authentication & Token Security

- Use short-lived JWT access tokens stored in httpOnly cookies as the preferred MVP direction.
- Do not store JWTs in localStorage.
- Cookies must use `Secure`, `HttpOnly`, and `SameSite=Lax` or stricter where compatible.
- Add CSRF protection or an equivalent same-site/token strategy for mutating requests.
- Require email uniqueness.
- Password reset and email verification token flows now exist. Email verification is not currently enforced before login or profile submission.
- Token expiry should be short enough to reduce risk and long enough for low-connectivity users. Proposed default: short-lived access token with refresh handling if needed.
- JWT role claims are convenience hints only. Sensitive admin, region, and file-access routes must check current database permissions.
- Admin actions such as exports and sensitive file access may require fresher authentication.
- Rate-limit login, signup, password reset, upload, and export endpoints. Basic in-memory rate limiting exists; distributed rate limiting is still deferred.
- Lock or slow down accounts after repeated failed login attempts.
- Store password hashes using a modern password hashing algorithm such as Argon2id or bcrypt.
- Never log passwords, document contents, signed URLs, or full emergency contact details in application logs.

## Known Attack Surfaces

1. **Credential stuffing against login**
   - **Mitigation:** Rate limiting, account lockout/slowdown, secure password hashing, email verification.

2. **Unauthorized regional data access**
   - **Mitigation:** Server-side region checks on every offer, student grid, alert, export, and file access query.

3. **Public or leaked document links**
   - **Mitigation:** Private buckets, short-lived signed URLs, export logging, no permanent public URLs.

4. **Malicious file uploads**
   - **Mitigation:** Extension/MIME validation, size limits, random storage keys, malware scanning where available.

5. **CSV export leakage**
   - **Mitigation:** Role-limited exports, region-limited filters, audit logs, short-lived file URLs.

6. **Horizontal privilege escalation**
   - **Mitigation:** Never trust client-provided `student_id`, `region_id`, or role values without server checks.

7. **Stored XSS in announcements, messages, conditions, and funding source fields**
   - **Mitigation:** Escape output, sanitize rich text if allowed, avoid arbitrary HTML in MVP.

8. **CSRF on admin actions**
   - **Mitigation:** CSRF tokens or same-site cookie strategy with server validation.

9. **Race conditions in review actions**
   - **Mitigation:** Check current status before updating; reject stale approval actions.

10. **Sensitive data in logs**
    - **Mitigation:** Redact request bodies for profile, document, emergency contact, and funding endpoints.
