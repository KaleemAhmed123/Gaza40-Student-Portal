# Requirements Audit

`vision/requirements.md` is the source of truth for MVP scope. `vision/problem_statement.md` explains the humanitarian context, but this audit does not expand MVP scope beyond the SRS unless an item is explicitly marked as an implicit requirement, open risk, or post-MVP consideration.

## Ambiguities & Contradictions

1. **SRS 2, 6, 7 - Volunteer vs Mentor vs Regional Admin roles**
   - **Problem:** The SRS uses "Volunteer", "Mentor/Volunteer", "Regional Admins", and "Gaza40+ staff/volunteers" in overlapping ways. It also says regional admins can assign volunteer roles.
   - **Recommended resolution:** Use one `users` account model with roles: `student`, `mentor`, `regional_admin`, `master_admin`. A user may have multiple roles only if approved by a Master Admin.

2. **SRS 3 - Volunteer registration is named but not specified**
   - **Problem:** The SRS says users can "Sign up as a volunteer", but no volunteer registration form fields are defined.
   - **Recommended resolution:** MVP should collect only basic volunteer fields needed by dashboards: full name, email, phone, date of birth, region/country interests, university affiliation if any, and consent checkbox. Treat deeper vetting as post-MVP unless the team provides requirements.

3. **SRS 4.2 - Student outside Gaza**
   - **Problem:** The system must not process students outside Gaza, but it does not say whether to block signup, allow signup but reject profile, or keep an audit record.
   - **Recommended resolution:** MVP should block profile submission unless a Gaza location is selected. Store no active student profile until the Gaza location requirement passes.

4. **SRS 4.2 - Profile review outcome is not defined**
   - **Problem:** It says profile goes "under review" for 2-3 days and alerts Master Admins, but approval, rejection, revision request, and unlock rules are missing.
   - **Recommended resolution:** Add profile statuses: `draft`, `submitted`, `under_review`, `approved`, `changes_requested`, `rejected`. Only approved students can access full dashboard features.

5. **SRS 4.2 and 4.3 - "Have University offers" is used twice**
   - **Problem:** A registration field asks whether the student has offers, and the Profile tab later says it changes to yes after a verified offer. This creates a difference between self-reported and verified state.
   - **Recommended resolution:** Store both `has_offer_self_reported` and `has_verified_offer`. Use `has_verified_offer` for admin/operational decisions.

6. **SRS 4.3 - Offer removal during review or after approval**
   - **Problem:** Students can remove offers, but the SRS does not say whether deletion is permanent, reviewed, or blocked when an offer is under admin/mentor review.
   - **Recommended resolution:** Use soft delete for offers. Allow students to request removal, but keep the record for audit and exports.

7. **SRS 4.3 - Offer edit review flow is unclear**
   - **Problem:** When an approved offer is edited, it locks again, regional admin assigns a mentor, changed fields are highlighted, and mentor approves those fields. It is unclear whether the regional admin or mentor has final approval.
   - **Recommended resolution:** Regional Admin owns final offer approval. Mentor can review and recommend approval, but cannot independently approve the offer for operational use.

8. **SRS 4.3 - Regional admin assignment is based on offer country**
   - **Problem:** A student may have offers in multiple countries. Regional admins see students "having offers in that region", but student records contain sensitive fields outside offer data.
   - **Recommended resolution:** Regional Admin access should be offer-country scoped. They may see limited student identity/contact fields only for students with offers in their assigned countries.

9. **SRS 4.3 - UK financial calculation uses yearly tuition but unclear duration units**
   - **Problem:** The data schema uses `duration_months`, but the UI asks duration in years. Living cost uses complete years and ignores partial years.
   - **Recommended resolution:** Store `duration_months` and derive complete years using `floor(duration_months / 12)`. If the UI captures years, convert to months.

10. **SRS 4.3 - Tuition check appears mathematically incomplete**
    - **Problem:** `REQ-4G` says total funds required is `(Scholarship + Private Funding) >= Course Tuition Fees`, but tuition is "per year" and course duration is multi-year.
    - **Recommended resolution:** For MVP, calculate total tuition requirement as `tuition_fee_per_year * complete_years`, unless the user confirms tuition should be checked per year only.

11. **SRS 4.3 - "Scholarship covers living cost" overrides calculation**
    - **Problem:** The SRS says if scholarship covers living costs, the system automatically checks yes, but does not say whether amount still matters.
    - **Recommended resolution:** If `scholarship_covers_living_cost` is true, show living cost as covered but still display the estimated living cost for admin visibility.

12. **SRS 4.3 - London detection is unspecified**
    - **Problem:** Living cost depends on whether the university is in London, but the country/university fields do not capture city or London flag.
    - **Recommended resolution:** MVP should include `uk_living_cost_location` with values `london` and `outside_london` for UK offers.

13. **SRS 4.4 - Query categories are incomplete**
    - **Problem:** One query category says "[Will tell more later after asking team]" and "Specific Volunteer" is not defined as a field or assignment process.
    - **Recommended resolution:** MVP should support the two defined query types and a generic `other` category. Treat specific volunteer routing as Tier 2 unless clarified.

14. **SRS 5.5, 6.5, 7.2, 7.3 - Messaging/chat is underspecified**
    - **Problem:** Admins can message students or volunteers, mentors can chat with students, and chat summaries remain stored, but no messaging model or real-time expectation is defined.
    - **Recommended resolution:** MVP should implement ticket comments/messages inside alerts, not real-time chat. Real-time chat is Tier 3 unless explicitly approved.

15. **SRS 5.1, 6.1, 7.1 - Announcement permissions conflict**
    - **Problem:** Master Admin can add/edit/delete announcements. Regional Admin page is "similar". Volunteer announcements need approval. It is unclear whether regional admins can publish globally.
    - **Recommended resolution:** For MVP, Master Admin can publish global announcements. Regional Admin and Mentor announcement creation should be draft/request-only or Tier 2.

16. **SRS 5.2 and 6.2 - Duplicate requirement ID `REQ-5B`**
    - **Problem:** Regional Admin student page reuses `REQ-5B`, which already belongs to Master Admin student page.
    - **Recommended resolution:** Rename internally as `REQ-6B` for Regional Admin student page.

17. **SRS 5.2 and 5.4 - CSV exports include file URLs**
    - **Problem:** Exporting raw file URLs can expose sensitive documents if URLs are public or long-lived.
    - **Recommended resolution:** Export private file reference IDs or short-lived signed URLs generated at export time. Log every export.

18. **SRS 7.3 - Mentor query flow is incomplete**
    - **Problem:** The final sentence ends at "Upon clicking it, the" and does not specify what happens after mentor marks resolved.
    - **Recommended resolution:** Mentor can propose resolution. Regional or Master Admin performs final close, or the system marks it resolved and notifies admins. Recommended MVP default: mentor marks `resolution_submitted`; admin closes.

19. **SRS 4.6 numbering duplication**
    - **Problem:** University Processes, Scholarships Processes, and Profile Tab are all labeled 4.6.
    - **Recommended resolution:** Keep functional names instead of relying on section numbering.

20. **SRS 4 Non-Functional Requirements numbering conflicts**
    - **Problem:** NFR section is labeled "4" after sections 5-7.
    - **Recommended resolution:** Treat the NFRs as global requirements, regardless of numbering.

## Missing Edge Cases

1. **Student changes Gaza location after approval**
   - **Why it matters:** Gaza location is an eligibility rule and a filtering field.
   - **System should do:** Lock the profile, set status to `under_review`, notify Master Admin, and preserve prior value in audit history.

2. **Student changes email after approval**
   - **Why it matters:** Email is identity and login-related.
   - **System should do:** Require verification of the new email before replacing the login email.

3. **Student reports no offer during registration but later adds one**
   - **Why it matters:** The Profile tab explicitly says this can happen.
   - **System should do:** Allow approved students to add offers later and set `has_verified_offer` only after offer approval.

4. **Student says they have an offer but does not add one**
   - **Why it matters:** SRS requires at least one offer.
   - **System should do:** Keep dashboard access limited until at least one offer is submitted, or show a required action banner after profile approval.

5. **Offer expires, is deferred, or is rejected**
   - **Why it matters:** Operational priority and funding calculation should not treat all offers the same.
   - **System should do:** Store offer status and allow admins to filter out rejected/expired offers from active operational views.

6. **Duplicate offer submitted**
   - **Why it matters:** Students may upload the same offer multiple times, inflating counts and funding needs.
   - **System should do:** Warn on same student, country, university, course name, course level, and start date. Do not hard-block unless exact duplicate is confirmed.

7. **Admin reviewer is unavailable**
   - **Why it matters:** Profiles/offers can get stuck in review.
   - **System should do:** Keep review queues shared by role/region, not assigned only to one person. Master Admin can reassign or override.

8. **No Regional Admin exists for an offer country**
   - **Why it matters:** Offer review alert would have no owner.
   - **System should do:** Route the alert to Master Admin and mark it `unassigned_region`.

9. **Student has offers in multiple regions**
   - **Why it matters:** Regional data isolation must be precise.
   - **System should do:** Each Regional Admin sees only offers in their assigned country and limited student identity/contact fields needed for that offer.

10. **Student replaces a document**
    - **Why it matters:** Reviewers need to know what changed.
    - **System should do:** Keep old document metadata, mark it superseded, and review the new file.

11. **Invalid or oversized upload on poor connectivity**
    - **Why it matters:** The SRS targets students in low-bandwidth conditions.
    - **System should do:** Validate type and size client-side and server-side, show clear retry messages, and avoid losing form progress.

12. **CSV export contains sensitive data**
    - **Why it matters:** Exports can become uncontrolled copies of PII.
    - **System should do:** Restrict export permissions, log exports, and include signed links only when necessary.

13. **Alert assigned to mentor but mentor does not accept**
    - **Why it matters:** Student support can stall.
    - **System should do:** Keep alert visible to assigning admin and support reassignment.

14. **Mentor marks a query resolved but student disagrees**
    - **Why it matters:** Premature closure can hide unresolved urgent issues.
    - **System should do:** Allow admin final closure or student reopen within a defined period.

15. **Announcement edited after publication**
    - **Why it matters:** Students may rely on deadlines or visa guidance.
    - **System should do:** Store update timestamp and editor. MVP can overwrite content but must keep audit history.

16. **Arabic RTL layout with uploaded English documents**
    - **Why it matters:** UI direction should not corrupt document names, emails, or numbers.
    - **System should do:** Apply RTL to layout/text, but keep emails, file names, dates, and numbers readable with proper direction handling.

## Implicit Requirements Not Stated in SRS

1. User authentication with JWT in httpOnly cookies, password reset, email verification, and secure logout.
2. Role-based access control enforced on the server, not only hidden in the UI.
3. Profile review and offer review workflows with statuses, timestamps, reviewer identity, and comments.
4. In-app notifications or email notifications for submitted profiles, submitted offers, assigned alerts, and resolved alerts.
5. Audit logs for sensitive actions: login, profile approval, offer approval, file access, export, role assignment, and alert closure.
6. Private file storage with authenticated access, signed URL generation, and file metadata records.
7. Export logging because CSV exports include sensitive student and document data.
8. Consent form version tracking so the organization knows which consent text was signed.
9. Basic admin user management and role assignment.
10. Regional access mapping between admin users and allowed countries.
11. Form draft persistence or autosave for long student forms under poor connectivity.
12. Standard status enums for profiles, offers, alerts, announcements, and volunteer accounts.
13. Soft deletion for offers, announcements, users, and uploaded file references.
14. Server-side validation for every client-side rule.
15. Timezone and date handling policy for deadlines and created/updated timestamps.

## Open Risks (Deferred / "Will Tell Later" Items)

| Risk | Affected Feature | Severity | Recommended Action |
|---|---|---:|---|
| Query category "[Will tell more later]" is undefined. | Student Queries, Admin Queries, Mentor workflow | High | Ship generic `other` category in MVP and collect exact categories before sprint 2. |
| Mentor query resolution sentence is incomplete. | Mentor Dashboard | High | Define MVP default: mentor submits resolution, admin closes. |
| Volunteer registration form is unspecified. | Volunteer signup, Volunteer grid | High | Use minimal MVP volunteer profile and mark advanced vetting as Tier 2. |
| Announcement creation rights conflict across roles. | Announcements | Medium | MVP: Master Admin publishes global announcements only. |
| Messaging/chat is underspecified. | Queries, Mentor/student support | High | MVP: ticket messages/comments; real-time chat deferred. |
| Final approval owner for edited offers is unclear. | Offer review | High | MVP: Regional Admin final approval; mentor can recommend. |
| Technology stack is not specified. | Whole system | Medium | Draft ADRs as proposed; discuss with user before implementation. |
| Data residency and compliance expectations are not specified. | File storage, PII, deployment | High | Choose private storage and strict access now; decide hosting region before launch. |
| University and scholarship process tabs are explicitly "later". | Student knowledge pages | Low | Place in Tier 3 and do not build for MVP. |
| Financial calculation assumptions may be wrong for non-UK offers. | Offer financial details | High | Implement exact SRS rules; label country-specific cost logic as manual outside UK. |
