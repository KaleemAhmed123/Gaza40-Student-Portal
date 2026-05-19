> Note: This is an external/reference solution document, not the current implementation contract.
> The current implementation source of truth is `vision/requirements.md`, `prisma/schema.prisma`, and the developer docs under `documentation/`.
> Some names and routes in this file differ from the implemented API because the project later simplified roles, regional admin profiles, query naming, and config management.

1. What Actually Needs to Be Built

This is essentially a:

Multi-role case management + student offer tracking system

The system manages:

Students from Gaza
Their university offers
Financial verification
Regional administration workflows
Volunteer/mentor query resolution
Approval pipelines
Document storage
Alert/ticket management

The most important architectural concern is:

RBAC (Role-Based Access Control)
Approval workflow
Configurable dropdown/master data
File/document management
Auditability
Simplicity
2. Recommended Tech Stack

Keep MVP extremely maintainable.

Backend
Node.js + TypeScript
NestJS OR Express + Prisma
PostgreSQL
Redis (optional later)
AWS S3 / Cloudflare R2 for file storage
ORM
Prisma

Reason:

Excellent schema management
Strong relations
Easy migrations
Fast CRUD generation
Authentication
JWT Access Token
Refresh Token
Role-based guards
3. High-Level Architecture
Client (Web/Mobile)
        |
REST API Gateway
        |
--------------------------------
| Auth Module
| User Module
| Offer Module
| Alert Module
| Approval Module
| Config Module
| Announcement Module
| Volunteer Module
| Chat Module
--------------------------------
        |
PostgreSQL + Object Storage
4. Core Design Principles
IMPORTANT RULE

Avoid over-normalization.

This project is operational software, not a banking engine.

Prioritize:

Readability
Speed of development
Admin filtering
Simpler queries
5. RBAC Design
Roles
enum Role {
  STUDENT
  MASTER_ADMIN
  REGIONAL_ADMIN
  MENTOR
}
6. Approval Workflow

This is the MOST IMPORTANT business logic.

Student Registration Flow
Student Registers
    ↓
Profile Status = PENDING_REVIEW
    ↓
Master Admin Reviews
    ↓
APPROVED / REJECTED
Offer Workflow
Student Adds Offer
    ↓
Offer Status = PENDING_REVIEW
    ↓
Regional Admin Reviews
    ↓
Assign Mentor (optional)
    ↓
APPROVED / REJECTED
Offer Edit Workflow
Approved Offer Edited
    ↓
Offer becomes LOCKED
    ↓
Changed fields tracked
    ↓
Regional Admin reviews
    ↓
Mentor validates
    ↓
Re-approved
7. Database Schema
USERS TABLE
users
Field	Type
id	uuid
role	enum
email	varchar unique
password_hash	text
full_name	varchar
phone	varchar
gender	enum
dob	date
is_active	boolean
created_at	timestamp
updated_at	timestamp
STUDENT_PROFILES TABLE
student_profiles
Field	Type
id	uuid
user_id	fk users
location_in_gaza	enum
location_other	varchar nullable
national_id_url	text
passport_status	enum
passport_url	text nullable
passport_location	enum
passport_location_other	varchar
has_university_offer	boolean
profile_status	enum
consent_form_url	text
emergency_contact_name	varchar
emergency_contact_relation	varchar
emergency_contact_phone	varchar
created_at	timestamp
ENGLISH_PROFICIENCY TABLE
english_proficiency
Field	Type
id	uuid
student_id	fk
moi_in_english	boolean
moi_letter_url	text
bachelor_university	varchar
workplace_certificate	boolean
other_certifications	text
OFFERS TABLE
offers
Field	Type
id	uuid
student_id	fk
region_country_id	fk
university_name	varchar
course_name	varchar
course_field	enum
course_level	enum
duration_years	decimal
start_date	date
offer_type	enum
conditions	text
offer_letter_url	text
tuition_fee	numeric
scholarship_available	boolean
scholarship_name	varchar
scholarship_amount	numeric
scholarship_letter_url	text
scholarship_covers_living	boolean
private_funding_amount	numeric
private_funding_source	text
living_cost_amount	numeric
funding_gap	numeric
offer_status	enum
is_locked	boolean
created_at	timestamp
updated_at	timestamp
OFFER_CHANGE_LOGS TABLE

Tracks edited fields after approval.

offer_change_logs
Field	Type
id	uuid
offer_id	fk
field_name	varchar
old_value	text
new_value	text
changed_by	fk users
created_at	timestamp
ALERTS TABLE
alerts
Field	Type
id	uuid
student_id	fk
offer_id	fk nullable
alert_type	enum
region_country_id	fk nullable
title	varchar
message	text
status	enum
assigned_to	fk users nullable
created_at	timestamp
resolved_at	timestamp nullable
ALERT_MESSAGES TABLE

Ticket conversation history.

alert_messages
Field	Type
id	uuid
alert_id	fk
sender_id	fk users
message	text
created_at	timestamp
ANNOUNCEMENTS TABLE
announcements
Field	Type
id	uuid
title	varchar
description	text
created_by	fk users
is_global	boolean
created_at	timestamp
REGIONS TABLE

This becomes your configurable country system.

regions
Field	Type
id	uuid
country_name	varchar
is_active	boolean
UNIVERSITIES TABLE

Configurable master table.

universities
Field	Type
id	uuid
region_id	fk
name	varchar
city	varchar
is_london	boolean
is_active	boolean
USER_REGION_ROLES TABLE

Allows multiple regional admins.

user_region_roles
Field	Type
id	uuid
user_id	fk
region_id	fk
role	enum
FILES TABLE

Centralized upload management.

files
Field	Type
id	uuid
uploaded_by	fk users
file_name	varchar
mime_type	varchar
file_size	integer
storage_key	text
created_at	timestamp
8. ENUMS
ProfileStatus
PENDING_REVIEW
APPROVED
REJECTED
OfferStatus
PENDING_REVIEW
APPROVED
REJECTED
NEEDS_CHANGES
AlertStatus
OPEN
IN_PROGRESS
RESOLVED
9. Configurable APIs (Very Important)

Do NOT hardcode dropdowns in frontend.

Build master configuration APIs.

CONFIG MODULE APIs
Get Countries
GET /configs/regions
Get Universities by Country
GET /configs/universities?regionId=
Get Course Fields
GET /configs/course-fields
Get Course Levels
GET /configs/course-levels
Get Gaza Locations
GET /configs/gaza-locations
Get Passport Statuses
GET /configs/passport-statuses
10. Authentication APIs
Register Student
POST /auth/register/student
Register Volunteer
POST /auth/register/volunteer
Login
POST /auth/login
Refresh Token
POST /auth/refresh
11. Student APIs
Complete Profile
POST /students/profile
Get My Profile
GET /students/profile
Update Profile
PUT /students/profile
12. Offer APIs
Create Offer
POST /offers
Get My Offers
GET /offers/my
Update Offer
PUT /offers/:id

Important:

If approved offer edited:

offer_status = PENDING_REVIEW
is_locked = true
Delete Offer
DELETE /offers/:id
Get Offer Details
GET /offers/:id
13. Admin APIs
MASTER ADMIN
Get Students
GET /admin/students

Supports:

?passportStatus=
&location=
&profileStatus=
&page=
Export Students CSV
GET /admin/students/export
Approve Student
POST /admin/students/:id/approve
Reject Student
POST /admin/students/:id/reject
OFFERS MANAGEMENT
Get Offers
GET /admin/offers

Filters:

?country=
?offerStatus=
?university=
?fundingType=
Approve Offer
POST /admin/offers/:id/approve
Reject Offer
POST /admin/offers/:id/reject
Assign Mentor
POST /admin/alerts/:id/assign

Body:

{
  "mentorId": ""
}
14. Alerts / Ticketing APIs
Create Alert
POST /alerts
Get My Alerts
GET /alerts/my
Get Assigned Alerts
GET /alerts/assigned
Add Message to Alert
POST /alerts/:id/messages
Resolve Alert
POST /alerts/:id/resolve
15. Announcement APIs
Create Announcement
POST /announcements
Get Announcements
GET /announcements
Update Announcement
PUT /announcements/:id
Delete Announcement
DELETE /announcements/:id
16. File Upload Strategy

Do NOT store files directly in DB.

Store:

S3/R2 storage key

inside DB.

Upload Flow
Frontend requests signed upload URL
    ↓
Backend generates signed URL
    ↓
Frontend uploads directly to storage
    ↓
Backend stores metadata
Upload API
POST /files/upload-url
17. Financial Calculation Logic

This should NOT be frontend-only.

Backend must calculate.

Logic
if (isLondon) {
   livingCost = 13761 * floor(durationYears)
} else {
   livingCost = 10539 * floor(durationYears)
}
Funding Calculation
totalFunds =
 scholarshipAmount +
 privateFunding
Tuition Check
if totalFunds >= tuitionFee
Living Cost Check
excess = totalFunds - tuitionFee
Result
if excess >= livingCost
    "Living cost covered"
else
    required = livingCost - excess
18. Suggested Folder Structure
src/
 ├── auth/
 ├── users/
 ├── students/
 ├── offers/
 ├── alerts/
 ├── announcements/
 ├── configs/
 ├── uploads/
 ├── common/
 ├── prisma/
 └── shared/
19. Security Recommendations
Required
JWT expiration
Rate limiting
File MIME validation
File size limits
RBAC middleware
SQL injection prevention
Audit logs
Soft delete for important records
20. MVP Priorities

Build in THIS order.

PHASE 1
Authentication
RBAC
Student Profile
File Upload
Offer CRUD
Approval Flow
PHASE 2
Alerts/Tickets
Mentor Assignment
Chat
CSV Export
Announcements
PHASE 3
University Processes
Scholarship Processes
Analytics
Notifications
WhatsApp integrations
21. Most Important Architectural Advice

Do NOT overengineer this.

You are not building:

microservices
event sourcing
CQRS
kafka pipelines

This is an operational workflow platform.
