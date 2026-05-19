# MVP Scope Definition

`vision/requirements.md` is the source of truth. The MVP should implement the SRS as a usable, thin operational system: student onboarding, offer collection/review, financial calculations, alerts, announcements, admin visibility, CSV export, and secure role-based access. Do not expand into a full CRM, fundraising platform, or real-time chat product.

## Tier 1 - Must Ship

| Feature | Justification | Complexity |
|---|---|---:|
| Student signup/login | Required for the primary user journey. | M |
| Basic volunteer signup/login | SRS includes volunteer signup; keep fields minimal until clarified. | M |
| Role-based access shell | Required for Student, Mentor, Regional Admin, and Master Admin views. | L |
| English/Arabic toggle with RTL | Explicit REQ-4A, REQ-4B, REQ-4C. | M |
| Student profile form | Core onboarding requirement from the SRS. | L |
| Gaza-only eligibility check | Explicit system rule; blocks non-Gaza processing. | S |
| Consent download/upload gate | Explicit REQ-4D, REQ-4E, REQ-4F. | M |
| Profile under-review state | Required after registration before dashboard access. | M |
| Master Admin profile review | Required to approve or block student access. | M |
| Secure document upload | Required for ID, passport, consent, MOI, offer, and scholarship files. | L |
| Student offer CRUD | Core offer-management requirement. | L |
| Required first offer when self-reported | Explicit SRS rule. | S |
| Offer review lock | Required for new offers and edited approved offers. | M |
| Regional offer review | Offers must route by country to Regional Admins. | L |
| Thin changed-field review | Required by SRS, but MVP should implement simple field-change highlighting only. | M |
| Financial gap calculations | Explicit dynamic calculation requirement. | L |
| UK/non-UK living cost handling | Required by SRS financial rules. | M |
| Boarding fee input for residential schools | Explicit conditional field. | S |
| Student queries/alerts | Required by REQ-4I; include defined categories plus `other`. | M |
| Ticket comments, not live chat | Satisfies communication need without overbuilding WebSockets. | M |
| Master Admin dashboards | Students, volunteers, offers, queries, announcements as required by SRS. | L |
| Regional Admin dashboards | Thin country-scoped students, volunteers, offers, and queries views. | L |
| Mentor dashboard | Thin assigned-query view and assigned student tiles only. | M |
| Global announcements | Master Admin CRUD and student read view. | M |
| CSV export | Required for student and offer grids, with filtered export support. | M |
| Server-side RBAC and regional isolation | Non-negotiable because data is sensitive. | L |
| Private file access | Required by security/privacy NFR. Use signed access, not public URLs. | M |
| Minimal audit logging | Log approvals, role changes, exports, and sensitive file access. | M |

## Tier 2 - Sprint 2

| Feature | Justification | Dependency |
|---|---|---|
| Better volunteer profile/vetting | Volunteer requirements are under-specified. | Basic volunteer signup |
| Announcement approval workflow | SRS hints volunteer announcements need approval, but details are unclear. | Global announcements |
| Email notifications | Useful, but not fully specified in SRS. | Alerts and review flows |
| In-app notification center | Improves UX after core alerts exist. | Alerts |
| Advanced mentor validation flow | Mentor offer-review authority is unclear. | Basic offer review |
| Query category refinements | SRS explicitly says more details will come later. | Basic queries |
| University autocomplete data management | SRS wants autocomplete, but source data is undefined. | Offer form |
| Advanced filters/aggregations | Useful but should not block basic grids/exports. | Admin dashboards |
| Student profile draft autosave | Valuable for poor connectivity, but can follow basic submission. | Profile form |
| Background CSV exports | Only needed when synchronous exports become slow. | CSV export |

## Tier 3 - Deferred

| Feature | Why Deferred | Revisit When |
|---|---|---|
| University Processes tab | SRS says this can be made later and is not urgent. | After MVP workflows stabilize |
| Scholarships Processes tab | SRS says this can be made later and is not urgent. | After content ownership is clear |
| Real-time chat/WebSockets | Not clearly required; ticket comments are enough for MVP. | If usage proves comments are insufficient |
| Fundraising campaign management | Problem statement mentions funding initiatives, but SRS requires calculations, not campaign tooling. | When fundraising workflows are specified |
| Full case-management pipeline | Problem statement is broader than SRS MVP. | When requirements expand |
| Analytics/data warehouse | CSV exports and grids are enough for MVP. | After operational data accumulates |
| Multi-organization support | Not in SRS. | Only if Gaza40+ requests partner workflows |
| Native mobile app | SRS requires responsive web, not native apps. | If web access fails real users |

## Build Order Recommendation

1. **Auth, roles, and base API structure**
   - Everything depends on identity, RBAC, and a clean Express API foundation.
   - Status: started. Express, Prisma, JWT cookie auth, health route, default role seed, and default region seed are in place.

2. **Student profile, consent, and document upload**
   - This is the first real student workflow and the biggest data-sensitivity area.

3. **Master Admin profile review**
   - Completes the onboarding loop and unlocks the rest of the student journey.

4. **Regions and regional access**
   - Must exist before offer review, regional dashboards, and exports.

5. **Offer form, review lock, and financial calculations**
   - This is the core operational value of the SRS.

6. **Admin grids, filters, and CSV export**
   - Gives the organization visibility and fulfills the dashboard requirements.

7. **Alerts, ticket comments, and mentor assignment**
   - Adds support workflow after student/offer data exists.

8. **Announcements**
   - Important, but less risky than onboarding, offers, and access control.

9. **Arabic/RTL verification**
   - Build i18n from the start, then verify all real screens before launch.

10. **Security and audit hardening**
    - Review uploads, exports, RBAC, regional isolation, and logs before release.

## Risks to MVP Timeline

| Risk | Impact | Mitigation |
|---|---|---|
| Volunteer and mentor flows are under-specified | Can delay dashboards and query handling. | Ship thin assigned-query workflow first. |
| Financial rules are disputed late | Can force offer-form and export rework. | Confirm duration/tuition assumptions before coding. |
| File security is underestimated | Serious privacy risk. | Implement private storage and signed access early. |
| Regional isolation bugs | Serious data leak risk. | Build server-side region filters before UI polish. |
| Trying to build all dashboards fully | MVP becomes too large. | Ship thin SRS-compliant dashboards, improve in Sprint 2. |

## Current Implementation Progress

| Area | Status | Notes |
|---|---|---|
| Backend scaffold | Started | Express + TypeScript app exists with health and auth modules. |
| Database setup | Started | Prisma + PostgreSQL configured; auth and student profile/document migrations exist. |
| Seed data | Started | Default roles and SRS offer countries have a seed script. |
| Auth | Started | Student/volunteer registration, login, logout, and `/me` endpoints exist. |
| Student profile | Started | Draft update and submit endpoints exist with required-field and required-document checks. |
| Document upload | Started | Local private profile document upload/download exists with file type and size validation. |
| Master Admin profile review | Started | List/detail/approve/request-changes/reject endpoints exist with DB-backed Master Admin role check. |
| RBAC | Started | Basic auth/role middleware exists; Master Admin DB role check exists; regional checks still pending. |
| Verification | Started | TypeScript check passes via `corepack pnpm lint`. |
