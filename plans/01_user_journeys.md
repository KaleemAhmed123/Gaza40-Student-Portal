# User Journey Maps

`vision/requirements.md` is the source of truth for MVP behavior. These journeys focus on the SRS MVP: registration, profile review, offer submission/review, alerts/queries, announcements, CSV export, and region-limited admin access.

## Student

### Lifecycle States

- `not_registered` -> chooses "Sign up as a student".
- `registered_draft_profile` -> account exists, profile is incomplete.
- `profile_submitted` -> all required profile fields and signed consent are uploaded.
- `profile_under_review` -> Master Admin review is pending; student sees locked review message.
- `profile_changes_requested` -> student must update fields/documents.
- `profile_rejected` -> student cannot access operational features.
- `profile_approved` -> student can access dashboard features.
- `offer_required` -> student self-reported having an offer but has not submitted one.
- `offer_submitted_under_review` -> new or edited offer is locked.
- `offer_approved` -> offer becomes usable in student and admin views.
- `offer_changes_requested` -> student must correct offer fields/files.
- `query_open` -> student has an active alert/query.
- `query_assigned` -> admin assigned query to mentor or regional admin.
- `query_resolution_submitted` -> mentor/admin says work is complete.
- `query_resolved` -> admin closes query.

### Critical Flows

1. **Student registration and profile review**
   1. Student selects "Sign up as a student".
   2. Student completes personal details, Gaza location, passport details, emergency contact, English proficiency details, and consent upload.
   3. System blocks submission until Gaza location and signed consent are provided.
   4. System sets profile to `profile_under_review`.
   5. Master Admin reviews profile.
   6. If approved, student gains access to dashboard. If rejected or changes requested, student sees the required next action.

2. **Student submits first offer**
   1. Student opens Offers tab.
   2. Student enters university, course, offer status, documents, tuition, scholarship, private funding, and living cost data.
   3. System calculates required funding and living cost coverage.
   4. Student submits offer.
   5. Offer tile becomes locked with "Offer under review".
   6. System alerts Regional Admins for the offer country, or Master Admin if no Regional Admin exists.

3. **Student edits an approved offer**
   1. Student edits an approved offer.
   2. System creates a review state and highlights changed fields for reviewers.
   3. Offer becomes locked again.
   4. Regional Admin reviews, optionally assigns mentor for validation.
   5. Regional Admin approves, requests changes, or rejects the edited offer.

4. **Student raises a query**
   1. Student opens Queries tab.
   2. Student selects a defined category, offer country if relevant, and details.
   3. System creates an open alert.
   4. Master Admin or relevant Regional Admin assigns it.
   5. Student receives responses through ticket messages/comments in MVP.
   6. Admin closes the query after resolution.

5. **Student reads announcements**
   1. Student opens Announcements tab.
   2. System displays global announcements.
   3. Student can filter or read by category if implemented in MVP.

### Inter-Role Handoffs

- Profile submission hands off from Student to Master Admin. If no admin acts, the profile remains locked; Master Admin queue must be shared.
- Offer submission hands off from Student to Regional Admin for the offer country. If no Regional Admin exists, Master Admin owns the review.
- Offer edit review may hand off from Regional Admin to Mentor for field validation. If mentor is unavailable, Regional Admin can reassign or decide without mentor input.
- Query submission hands off to Master Admin or Regional Admin. If assigned mentor does not accept, admin can reassign.

### Edge Cases & Failure Modes

- Student outside Gaza cannot complete MVP profile.
- Student self-reports having an offer but never submits one; dashboard should show required action.
- Student has offers in multiple countries; each offer routes to the appropriate region.
- Document upload fails; form progress should not be lost.
- Student changes sensitive profile data after approval; profile returns to review.
- Student disagrees with query closure; MVP should allow reopen or admin review.

## Volunteer/Mentor

### Lifecycle States

- `not_registered` -> chooses "Sign up as a volunteer".
- `volunteer_profile_submitted` -> basic volunteer profile is awaiting admin review.
- `volunteer_approved` -> can access volunteer dashboard.
- `mentor_role_assigned` -> can receive assigned alerts.
- `alert_assigned` -> alert appears in Queries tab.
- `alert_accepted` -> mentor accepts work and student tile appears.
- `working_with_student` -> mentor communicates through ticket messages/comments.
- `resolution_submitted` -> mentor marks the work resolved for admin review.
- `inactive` -> access removed or disabled by admin.

### Critical Flows

1. **Volunteer signup**
   1. Volunteer selects "Sign up as a volunteer".
   2. Volunteer provides minimal MVP profile fields.
   3. Admin reviews and approves the account.
   4. Admin assigns mentor role and optionally region/country relationship.

2. **Accept assigned query**
   1. Mentor opens Queries tab.
   2. Mentor sees alerts assigned by admin.
   3. Mentor accepts an alert.
   4. Student tile appears in Students tab.
   5. Mentor can message/comment on the ticket.

3. **Resolve assigned query**
   1. Mentor works with student.
   2. Mentor records short summary and marks `resolution_submitted`.
   3. Admin reviews the summary.
   4. Admin closes, reopens, or reassigns the ticket.

4. **View announcements**
   1. Mentor opens Announcements tab.
   2. Mentor reads global announcements.
   3. Mentor-created announcements are Tier 2 unless approved by final requirements.

### Inter-Role Handoffs

- Admin assigns alert to Mentor. If Mentor does not accept, Admin reassigns.
- Mentor submits resolution to Admin. Admin performs final closure in MVP.
- Mentor may validate changed offer fields only if Regional Admin requests it. Regional Admin keeps final approval authority.

### Edge Cases & Failure Modes

- Volunteer signup fields are under-specified; MVP should avoid complex vetting until clarified.
- Mentor tries to view unassigned students; access must be denied.
- Mentor becomes unavailable; assigned tickets must remain visible to admin for reassignment.
- Mentor gives inaccurate advice; admin closure and audit trail reduce risk.

## Regional Admin

### Lifecycle States

- `admin_invited_or_created` -> Master Admin creates or approves the account.
- `regional_admin_active` -> assigned one or more countries/regions.
- `reviewing_offer_queue` -> handles offers for assigned countries.
- `managing_regional_queries` -> handles alerts related to assigned countries.
- `assigning_mentor` -> assigns volunteers to alerts or offer validation.
- `inactive` -> access disabled by Master Admin.

### Critical Flows

1. **Review regional offer**
   1. Regional Admin opens Offers page.
   2. Selects assigned country.
   3. Reviews submitted or edited offers.
   4. Checks offer document, scholarship document, and financial calculation.
   5. Approves, rejects, or requests changes.

2. **Assign mentor to offer or query**
   1. Regional Admin opens offer/query needing support.
   2. Selects an approved mentor.
   3. Mentor receives assignment.
   4. Regional Admin monitors progress and finalizes.

3. **Regional student grid**
   1. Regional Admin opens Students page.
   2. System shows only students with offers in assigned countries.
   3. Grid shows limited fields: name, date of birth, phone, email.

4. **Regional CSV export**
   1. Regional Admin filters regional offers.
   2. Exports allowed regional data.
   3. System logs export with filters, timestamp, and user.

5. **Regional query handling**
   1. Regional Admin opens Queries page.
   2. Views active alerts for assigned countries.
   3. Responds, assigns mentor, or resolves according to permissions.

### Inter-Role Handoffs

- Student offer submission creates Regional Admin review work.
- Regional Admin can hand mentor-specific work to Mentor.
- Regional Admin can escalate unclear, cross-region, or sensitive cases to Master Admin.
- Master Admin can override or reassign regional work if admin is unavailable.

### Edge Cases & Failure Modes

- A country has no assigned Regional Admin; Master Admin gets the alert.
- Regional Admin tries to access another country; server denies access.
- Student has multiple offers in different countries; Regional Admin sees only relevant offers and limited student identity.
- Regional Admin exports data; export must not expose unrestricted document links.

## Master Admin

### Lifecycle States

- `master_admin_active` -> full operational access.
- `reviewing_profiles` -> approves or rejects student profiles.
- `managing_global_data` -> views full student, volunteer, offer, query, and announcement data.
- `managing_roles_regions` -> assigns regional admins and mentors.
- `inactive` -> account disabled by another authorized owner or system process.

### Critical Flows

1. **Review student profile**
   1. Master Admin opens Students page.
   2. Filters profiles under review.
   3. Reviews Gaza location, consent, ID, passport, and profile fields.
   4. Approves, requests changes, or rejects.

2. **Manage announcements**
   1. Master Admin opens Announcements page.
   2. Creates, edits, deletes, or publishes global announcements.
   3. System logs changes.

3. **Manage students and exports**
   1. Master Admin opens Students page.
   2. Filters by passport status, Gaza location, consent, and other registration fields.
   3. Exports full or filtered CSV.
   4. Export action is logged.

4. **Manage offers**
   1. Master Admin opens Offers page.
   2. Selects country or all-country view.
   3. Filters and aggregates by offer type, university, and funding status.
   4. Can intervene in stuck regional reviews.

5. **Manage alerts and escalations**
   1. Master Admin opens Queries page.
   2. Views all active alerts with timestamps and emergency/contact info.
   3. Assigns to Regional Admin or Mentor.
   4. Resolves, reopens, or escalates.

### Inter-Role Handoffs

- Student profile submission routes to Master Admin.
- Offer country without Regional Admin routes to Master Admin.
- Regional Admin can escalate cases to Master Admin.
- Mentor resolution routes back to Admin for final closure in MVP.

### Edge Cases & Failure Modes

- Multiple Master Admins act on the same profile or offer; system should prevent conflicting final actions with timestamps/status checks.
- Master Admin exports sensitive records; export must be logged.
- Deleted announcements or offers may be needed for audit; use soft delete.
- Emergency contact data appears in query views; restrict it to admin roles only.
