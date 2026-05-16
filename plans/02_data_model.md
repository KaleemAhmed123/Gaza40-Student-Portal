# Extended Data Model

This model is based on `vision/requirements.md` and is intentionally MVP-focused. It extends the SRS high-level schema only where needed for roles, regional access, review workflows, file handling, announcements, alerts, and auditability.

## Design Decisions

- **Database type:** Use PostgreSQL for MVP. The SRS has structured users, offers, alerts, roles, regions, and exports with clear relationships. Initial Prisma migration exists for auth, roles, regions, profiles, and audit logs.
- **Normalization level:** Keep normalization practical. Use shared tables for users, roles, documents, regions, offers, alerts, and announcements, but avoid a large CRM-style model.
- **Soft delete strategy:** Soft delete core operational records with `deleted_at` and `deleted_by` where needed. This applies to users, offers, announcements, alerts, and documents because humanitarian data decisions may need audit history.
- **Audit log approach:** Use one append-only `audit_logs` table for sensitive actions. Do not overbuild event sourcing for MVP.
- **File reference strategy:** Store files in private object storage and store metadata in `documents`. Database rows should contain storage keys, not public URLs. CSV exports may include short-lived signed URLs or internal file references.
- **Review strategy:** Store current status on the main record, and store reviewer comments/history in small review tables or audit logs. This keeps querying simple while preserving accountability.
- **Financial calculation strategy:** Calculate offer funding/living-cost summaries in the API from offer fields first. Store a separate summary table only if reporting performance or audit requirements later justify it.
- **Mentor tile strategy:** Derive mentor student tiles from active alert assignments first. Add a separate mentor-student assignment table only if the UI later needs assignments that are not tied to alerts.

## Tables / Collections

### Table name: `users`

- `id` UUID primary key.
- `email` varchar unique not null.
- `password_hash` text not null.
- `full_name` varchar not null.
- `phone` varchar nullable.
- `date_of_birth` date nullable.
- `account_status` enum not null default `active`: `pending`, `active`, `disabled`, `rejected`.
- `email_verified_at` timestamp nullable.
- `last_login_at` timestamp nullable.
- `created_at` timestamp not null.
- `updated_at` timestamp not null.
- `deleted_at` timestamp nullable.

**Relationships:** One user may have one student profile, one volunteer profile, and multiple roles.

**Indexes recommended:** `email` unique, `account_status`, `created_at`.

### Table name: `roles`

- `id` UUID primary key.
- `code` enum unique not null: `student`, `mentor`, `regional_admin`, `master_admin`.
- `name` varchar not null.

**Relationships:** Referenced by `user_roles`.

**Indexes recommended:** unique `code`.

**Seed status:** Default role seed exists for `student`, `mentor`, `regional_admin`, and `master_admin`.

### Table name: `user_roles`

- `id` UUID primary key.
- `user_id` UUID foreign key to `users.id` not null.
- `role_id` UUID foreign key to `roles.id` not null.
- `assigned_by` UUID foreign key to `users.id` nullable.
- `created_at` timestamp not null.
- `revoked_at` timestamp nullable.

**Relationships:** Many-to-many user-role mapping.

**Indexes recommended:** unique active pair on `user_id`, `role_id`, index `role_id`.

### Table name: `regions`

- `id` UUID primary key.
- `country_code` varchar unique not null.
- `country_name` varchar unique not null.
- `is_active` boolean not null default true.
- `created_at` timestamp not null.

**Status enum:** Use active/inactive flag rather than a separate enum.

**Indexes recommended:** unique `country_name`, unique `country_code`.

**Seed status:** Default region seed exists for the SRS offer countries: UK, Ireland, Italy, Spain, Egypt, US, Bosnia, and Turkey.

### Table name: `admin_regions`

- `id` UUID primary key.
- `user_id` UUID foreign key to `users.id` not null.
- `region_id` UUID foreign key to `regions.id` not null.
- `assigned_by` UUID foreign key to `users.id` not null.
- `created_at` timestamp not null.
- `revoked_at` timestamp nullable.

**Relationships:** Many-to-many Regional Admin to country/region.

**Indexes recommended:** `user_id`, `region_id`, unique active pair on `user_id`, `region_id`.

### Table name: `student_profiles`

- `id` UUID primary key.
- `user_id` UUID foreign key to `users.id` unique not null.
- `full_name_english` varchar not null.
- `sex` enum not null: `male`, `female`.
- `date_of_birth` date not null.
- `location_in_gaza` enum not null: `deir_al_balah`, `bureij`, `north_gaza`, `gaza_city`, `nuseirat`, `zawaidah`, `maghazi`, `khan_yunis`, `other`.
- `location_other` varchar nullable.
- `has_offer_self_reported` boolean not null.
- `has_verified_offer` boolean not null default false.
- `passport_status` enum not null: `valid`, `valid_expires_within_year`, `invalid_lost_never_had_one`.
- `passport_location` enum nullable: `in_gaza_with_me`, `egypt`, `ramallah`, `jordan`, `other`.
- `passport_location_other` varchar nullable.
- `emergency_contact_name` varchar not null.
- `emergency_contact_relation` varchar not null.
- `emergency_contact_phone` varchar not null.
- `english_moi` boolean not null.
- `bachelor_uni_gaza` varchar nullable.
- `english_workplace_certificate_possible` boolean not null.
- `english_other_certs` text nullable.
- `consent_signed` boolean not null default false.
- `profile_status` enum not null default `draft`: `draft`, `submitted`, `under_review`, `approved`, `changes_requested`, `rejected`.
- `reviewed_by` UUID foreign key to `users.id` nullable.
- `reviewed_at` timestamp nullable.
- `review_notes` text nullable.
- `created_at` timestamp not null.
- `updated_at` timestamp not null.
- `deleted_at` timestamp nullable.

**Relationships:** One student profile belongs to one user and has many documents, offers, and alerts.

**Indexes recommended:** `profile_status`, `location_in_gaza`, `passport_status`, `has_verified_offer`, `created_at`.

### Table name: `volunteer_profiles`

- `id` UUID primary key.
- `user_id` UUID foreign key to `users.id` unique not null.
- `phone` varchar nullable.
- `university_affiliation` varchar nullable.
- `preferred_region_id` UUID foreign key to `regions.id` nullable.
- `volunteer_status` enum not null default `pending`: `pending`, `approved`, `rejected`, `inactive`.
- `reviewed_by` UUID foreign key to `users.id` nullable.
- `reviewed_at` timestamp nullable.
- `created_at` timestamp not null.
- `updated_at` timestamp not null.

**Relationships:** User may become mentor through `user_roles`.

**Indexes recommended:** `volunteer_status`, `preferred_region_id`.

### Table name: `documents`

- `id` UUID primary key.
- `owner_user_id` UUID foreign key to `users.id` not null.
- `student_profile_id` UUID foreign key to `student_profiles.id` nullable.
- `offer_id` UUID foreign key to `offers.id` nullable.
- `document_type` enum not null: `national_id`, `passport`, `moi_letter`, `consent_form`, `offer_letter`, `scholarship_letter`, `other`.
- `original_filename` varchar not null.
- `mime_type` varchar not null.
- `file_size_bytes` integer not null.
- `storage_bucket` varchar not null.
- `storage_key` text not null.
- `status` enum not null default `active`: `active`, `superseded`, `deleted`, `failed_scan`.
- `uploaded_by` UUID foreign key to `users.id` not null.
- `created_at` timestamp not null.
- `deleted_at` timestamp nullable.

**Relationships:** Documents attach to a user, and optionally to a student profile or offer.

**Indexes recommended:** `owner_user_id`, `student_profile_id`, `offer_id`, `document_type`, `status`.

### Table name: `offers`

- `id` UUID primary key.
- `student_profile_id` UUID foreign key to `student_profiles.id` not null.
- `region_id` UUID foreign key to `regions.id` not null.
- `university_name` varchar not null.
- `course_name` varchar not null.
- `course_field` enum not null: `medicine`, `engineering`, `pure_sciences`, `arts`.
- `course_level` enum not null: `residential_independent_school`, `foundation_bachelor`, `bachelor`, `integrated_master`, `master`, `phd`.
- `duration_months` integer not null.
- `programme_start_date` date not null.
- `offer_type` enum not null: `conditional`, `unconditional`, `deferred`, `rejected`.
- `conditions` text nullable.
- `tuition_fee_per_year` decimal not null.
- `course_fee_source_url` text nullable.
- `has_scholarship` boolean not null default false.
- `scholarship_name` varchar nullable.
- `scholarship_amount_per_year` decimal nullable.
- `scholarship_covers_living_cost` boolean not null default false.
- `private_funding_amount` decimal not null default 0.
- `private_funding_source` text nullable.
- `uk_living_cost_location` enum nullable: `london`, `outside_london`.
- `manual_living_cost_for_visa` decimal nullable.
- `boarding_fees` decimal nullable.
- `offer_review_status` enum not null default `under_review`: `draft`, `under_review`, `approved`, `changes_requested`, `rejected`, `removed`.
- `locked_for_review` boolean not null default true.
- `reviewed_by` UUID foreign key to `users.id` nullable.
- `reviewed_at` timestamp nullable.
- `created_at` timestamp not null.
- `updated_at` timestamp not null.
- `deleted_at` timestamp nullable.

**Relationships:** Offer belongs to one student profile and one region/country. Offer has documents, reviews, and funding calculation data.

**Indexes recommended:** `student_profile_id`, `region_id`, `offer_review_status`, `offer_type`, `university_name`, `course_level`, `created_at`.

### Table name: `offer_reviews`

- `id` UUID primary key.
- `offer_id` UUID foreign key to `offers.id` not null.
- `reviewer_user_id` UUID foreign key to `users.id` not null.
- `review_action` enum not null: `submitted`, `approved`, `changes_requested`, `rejected`, `mentor_assigned`, `mentor_recommended_approval`.
- `changed_fields` json nullable.
- `notes` text nullable.
- `created_at` timestamp not null.

**Relationships:** Many review events per offer.

**Indexes recommended:** `offer_id`, `reviewer_user_id`, `review_action`, `created_at`.

### Table name: `alerts`

- `id` UUID primary key.
- `student_profile_id` UUID foreign key to `student_profiles.id` not null.
- `offer_id` UUID foreign key to `offers.id` nullable.
- `region_id` UUID foreign key to `regions.id` nullable.
- `alert_type` enum not null: `profile_review`, `offer_review`, `visa_or_offer_issue`, `whatsapp_group_issue`, `other`.
- `message` text not null.
- `status` enum not null default `open`: `open`, `assigned`, `accepted`, `resolution_submitted`, `resolved`, `reopened`, `cancelled`.
- `priority` enum not null default `normal`: `low`, `normal`, `urgent`.
- `created_by` UUID foreign key to `users.id` not null.
- `resolved_by` UUID foreign key to `users.id` nullable.
- `resolved_at` timestamp nullable.
- `created_at` timestamp not null.
- `updated_at` timestamp not null.

**Relationships:** Alert belongs to a student and optionally an offer/region. Assignments and messages connect to alerts.

**Indexes recommended:** `student_profile_id`, `region_id`, `status`, `alert_type`, `priority`, `created_at`.

### Table name: `alert_assignments`

- `id` UUID primary key.
- `alert_id` UUID foreign key to `alerts.id` not null.
- `assigned_to_user_id` UUID foreign key to `users.id` not null.
- `assigned_by_user_id` UUID foreign key to `users.id` not null.
- `assignment_status` enum not null default `assigned`: `assigned`, `accepted`, `declined`, `completed`, `revoked`.
- `created_at` timestamp not null.
- `accepted_at` timestamp nullable.
- `completed_at` timestamp nullable.

**Relationships:** Many assignments per alert over time, one active assignment at a time for MVP.

**Indexes recommended:** `alert_id`, `assigned_to_user_id`, `assignment_status`.

### Table name: `alert_messages`

- `id` UUID primary key.
- `alert_id` UUID foreign key to `alerts.id` not null.
- `sender_user_id` UUID foreign key to `users.id` not null.
- `message_body` text not null.
- `internal_only` boolean not null default false.
- `created_at` timestamp not null.
- `deleted_at` timestamp nullable.

**Relationships:** Ticket comments/messages for MVP. This is not real-time chat.

**Indexes recommended:** `alert_id`, `sender_user_id`, `created_at`.

### Table name: `announcements`

- `id` UUID primary key.
- `title` varchar not null.
- `body` text not null.
- `category` enum not null: `scholarship`, `deadline`, `passport`, `webinar`, `miscellaneous`.
- `language` enum not null default `en`: `en`, `ar`.
- `status` enum not null default `draft`: `draft`, `published`, `archived`, `deleted`.
- `created_by` UUID foreign key to `users.id` not null.
- `published_by` UUID foreign key to `users.id` nullable.
- `published_at` timestamp nullable.
- `created_at` timestamp not null.
- `updated_at` timestamp not null.
- `deleted_at` timestamp nullable.

**Relationships:** Global announcements for MVP.

**Indexes recommended:** `status`, `category`, `language`, `published_at`.

### Table name: `exports`

- `id` UUID primary key.
- `exported_by_user_id` UUID foreign key to `users.id` not null.
- `export_type` enum not null: `students`, `offers`, `volunteers`, `alerts`.
- `scope` enum not null: `global`, `regional`.
- `region_id` UUID foreign key to `regions.id` nullable.
- `filters_json` json nullable.
- `row_count` integer not null.
- `created_at` timestamp not null.

**Relationships:** Export audit record only. The CSV file itself does not need permanent storage in MVP.

**Indexes recommended:** `exported_by_user_id`, `export_type`, `scope`, `created_at`.

### Table name: `audit_logs`

- `id` UUID primary key.
- `actor_user_id` UUID foreign key to `users.id` nullable.
- `action` varchar not null.
- `entity_type` varchar not null.
- `entity_id` UUID nullable.
- `metadata_json` json nullable.
- `ip_address` varchar nullable.
- `user_agent` text nullable.
- `created_at` timestamp not null.

**Relationships:** Append-only log across sensitive actions.

**Indexes recommended:** `actor_user_id`, `action`, `entity_type`, `entity_id`, `created_at`.

## Missing Tables Identified

| Missing Table | Why It Is Required For MVP |
|---|---|
| `roles` and `user_roles` | SRS requires Students, Master Admins, Regional Admins, and Mentors. |
| `regions` and `admin_regions` | Regional Admin data isolation depends on country/region assignment. |
| `student_profiles` | Student profile data should not live only in `users`. |
| `volunteer_profiles` | Volunteer dashboard and registration need profile state. |
| `documents` | Multiple file uploads need private storage references, metadata, and access control. |
| `offer_reviews` | Offers lock under review and edited fields need review history. |
| `alert_assignments` | Admins assign alerts to mentors or volunteers. |
| `alert_messages` | MVP needs ticket comments/messages because chat is underspecified. |
| `announcements` | SRS requires admin-created announcements visible to students. |
| `exports` | CSV export of sensitive data must be logged. |
| `audit_logs` | Sensitive humanitarian data requires accountability. |

## Entity Relationship Summary

Users authenticate once and receive one or more roles through `user_roles`. A student user has one `student_profiles` record, which owns profile documents, offers, and alerts. A volunteer user has one `volunteer_profiles` record and may become a mentor through role assignment.

Regions represent offer countries from the SRS country list. Regional Admins are connected to allowed countries through `admin_regions`. Offers belong to a student profile and a region, which enables regional filtering and access control. Offer documents are stored through `documents`, and offer review history is stored in `offer_reviews`.

Alerts belong to students and optionally to offers/regions. Admins assign alerts through `alert_assignments`. Mentors communicate through `alert_messages` and receive student tiles derived from accepted active alert assignments. Master Admins can see global data; Regional Admins are restricted to their assigned offer countries.

Announcements are global in MVP. Exports and audit logs record sensitive administrative activity without introducing a larger case-management system.
