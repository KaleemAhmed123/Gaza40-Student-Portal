# API Documentation

## Conventions

- Base API prefix: `/api`
- Success response shape:

```json
{
  "data": {}
}
```

- Error response shape:

```json
{
  "error": {
    "message": "Error message"
  }
}
```

## Health

### `GET /health`

Checks that the server is running.

### `GET /health/db`

Checks database reachability.

## Auth

### `POST /api/auth/register/student`

Registers a student account and creates an initial student profile.

```powershell
curl.exe -i -c student.cookies -X POST http://localhost:4000/api/auth/register/student `
  -H "Content-Type: application/json" `
  -d '{"email":"student1@example.com","password":"Password123!","fullName":"Student One","hasOfferSelfReported":true}'
```

### `POST /api/auth/register/volunteer`

Registers a volunteer account and creates an initial volunteer profile.

```powershell
curl.exe -i -c volunteer.cookies -X POST http://localhost:4000/api/auth/register/volunteer `
  -H "Content-Type: application/json" `
  -d '{"email":"volunteer1@example.com","password":"Password123!","fullName":"Volunteer One","phone":"+970599000000","universityAffiliation":"Example University"}'
```

### `POST /api/auth/login`

Logs in and sets an httpOnly JWT cookie.

```powershell
curl.exe -i -c student.cookies -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"student1@example.com","password":"Password123!"}'
```

### `POST /api/auth/logout`

Clears the auth cookie.

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/auth/logout
```

### `GET /api/auth/me`

Returns the current authenticated user.

```powershell
curl.exe -i -b student.cookies http://localhost:4000/api/auth/me
```

## Documents

### `POST /api/documents`

Uploads a profile or offer document.

Multipart field:
- `file`

Body:
- `documentType`

Allowed document types:
- `national_id`
- `passport`
- `moi_letter`
- `consent_form`
- `offer_letter`
- `scholarship_letter`

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/documents `
  -F "documentType=consent_form" `
  -F "file=@C:\tmp\consent.pdf"
```

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/documents `
  -F "documentType=national_id" `
  -F "file=@C:\tmp\national-id.jpg"
```

Offer document upload requires `offerId`:

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/documents `
  -F "documentType=offer_letter" `
  -F "offerId=OFFER_ID" `
  -F "file=@C:\tmp\offer-letter.pdf"
```

### `GET /api/documents/:id/download`

Downloads a protected document if the requester is the owner or an active Master Admin.

```powershell
curl.exe -L -b student.cookies http://localhost:4000/api/documents/DOCUMENT_ID/download -o downloaded-document.pdf
```

## Student Profile

### `GET /api/student/profile/me`

Returns the current student's profile.

```powershell
curl.exe -i -b student.cookies http://localhost:4000/api/student/profile/me
```

### `PATCH /api/student/profile/me`

Updates the current student's draft profile.

```powershell
curl.exe -i -b student.cookies -X PATCH http://localhost:4000/api/student/profile/me `
  -H "Content-Type: application/json" `
  -d '{"fullNameEnglish":"Student One","sex":"male","dateOfBirth":"2000-01-15","locationInGaza":"gaza_city","hasOfferSelfReported":true,"passportStatus":"invalid_lost_never_had_one","emergencyContactFirstName":"Emergency","emergencyContactRelation":"Parent","emergencyContactPhone":"+970599111111","englishMoi":false,"englishWorkplaceCertificatePossible":false,"englishOtherCerts":"IELTS planned"}'
```

### `POST /api/student/profile/me/submit`

Submits the current student's profile for Master Admin review.

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/student/profile/me/submit
```

## Config / Master Data

Public read routes for frontend dropdowns and autocomplete.

### `GET /api/config/regions`

```powershell
curl.exe -i http://localhost:4000/api/config/regions
```

### `GET /api/config/options?groupKey=...`

Seeded groups include:
- `course_field`
- `course_level`
- `offer_type`
- `alert_type`
- `announcement_category`

```powershell
curl.exe -i "http://localhost:4000/api/config/options?groupKey=course_field"
curl.exe -i "http://localhost:4000/api/config/options?groupKey=course_level"
curl.exe -i "http://localhost:4000/api/config/options?groupKey=offer_type"
```

### `GET /api/config/universities`

Optional query:
- `regionId`
- `search`

```powershell
curl.exe -i "http://localhost:4000/api/config/universities?search=manchester"
curl.exe -i "http://localhost:4000/api/config/universities?regionId=REGION_ID"
```

## Master Admin Config Management

Requires a user whose `roles` includes `master_admin`.

### Config Options

```powershell
curl.exe -i -b admin.cookies -X POST http://localhost:4000/api/admin/config/options `
  -H "Content-Type: application/json" `
  -d '{"groupKey":"course_field","value":"business","labelEn":"Business","sortOrder":50}'
```

```powershell
curl.exe -i -b admin.cookies -X PATCH http://localhost:4000/api/admin/config/options/OPTION_ID `
  -H "Content-Type: application/json" `
  -d '{"labelEn":"Business and Management","sortOrder":55}'
```

```powershell
curl.exe -i -b admin.cookies -X DELETE http://localhost:4000/api/admin/config/options/OPTION_ID
```

### Regions

Regions are configurable master data, but they remain real records because offers, universities, alerts, and regional admins relate to them.

```powershell
curl.exe -i -b admin.cookies -X POST http://localhost:4000/api/admin/config/regions `
  -H "Content-Type: application/json" `
  -d '{"code":"FR","name":"France"}'
```

```powershell
curl.exe -i -b admin.cookies -X PATCH http://localhost:4000/api/admin/config/regions/REGION_ID `
  -H "Content-Type: application/json" `
  -d '{"name":"France","isActive":true}'
```

```powershell
curl.exe -i -b admin.cookies -X DELETE http://localhost:4000/api/admin/config/regions/REGION_ID
```

### Universities

```powershell
curl.exe -i -b admin.cookies -X POST http://localhost:4000/api/admin/config/universities `
  -H "Content-Type: application/json" `
  -d '{"regionId":"REGION_ID","name":"Example University","city":"London","isLondon":true}'
```

```powershell
curl.exe -i -b admin.cookies -X PATCH http://localhost:4000/api/admin/config/universities/UNIVERSITY_ID `
  -H "Content-Type: application/json" `
  -d '{"city":"Manchester","isLondon":false}'
```

```powershell
curl.exe -i -b admin.cookies -X DELETE http://localhost:4000/api/admin/config/universities/UNIVERSITY_ID
```

## Student Offers

Student offer APIs require an approved student profile.

### `GET /api/student/offers`

Lists the current student's offers with calculated funding summary.

```powershell
curl.exe -i -b student.cookies http://localhost:4000/api/student/offers
```

### `POST /api/student/offers`

Creates a draft offer. Use either `universityId`, `regionId`, or `universityCountry`.

For now, `universityCountry` is the easiest manual-test option and matches seeded regions such as `UK`, `Ireland`, `Italy`, `Spain`, `Egypt`, `US`, `Bosnia`, or `Turkey`. When `universityId` is used later, the backend derives the offer region from the selected university.

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/student/offers `
  -H "Content-Type: application/json" `
  -d '{"universityCountry":"UK","universityName":"Example University","courseName":"MSc Public Health","courseField":"Public Health","courseLevel":"Masters","durationYears":2.5,"programmeStartDate":"2026-09-01","offerType":"Conditional","conditions":"Final transcript required","tuitionFeePerYear":12000,"courseFeeSourceUrl":"https://example.edu/fees","hasScholarship":true,"scholarshipName":"Example Scholarship","scholarshipAmountPerYear":10000,"scholarshipCoversLivingCost":false,"privateFundingAmount":3000,"privateFundingSource":"Family support","livingCostLocationKey":"outside_london"}'
```

### `GET /api/student/offers/:id`

```powershell
curl.exe -i -b student.cookies http://localhost:4000/api/student/offers/OFFER_ID
```

### `PATCH /api/student/offers/:id`

Updates a draft or changes-requested offer. Editing an approved offer creates a revision and moves it back to `under_review`.

```powershell
curl.exe -i -b student.cookies -X PATCH http://localhost:4000/api/student/offers/OFFER_ID `
  -H "Content-Type: application/json" `
  -d '{"universityCountry":"UK","universityName":"Example University","courseName":"MSc Public Health","courseField":"Public Health","courseLevel":"Masters","durationYears":2.5,"programmeStartDate":"2026-09-01","offerType":"Unconditional","tuitionFeePerYear":12000,"courseFeeSourceUrl":"https://example.edu/fees","hasScholarship":true,"scholarshipName":"Example Scholarship","scholarshipAmountPerYear":10000,"scholarshipCoversLivingCost":false,"privateFundingAmount":3000,"privateFundingSource":"Family support","livingCostLocationKey":"outside_london"}'
```

### `POST /api/student/offers/:id/submit`

Requires active `offer_letter`. If `hasScholarship=true`, also requires active `scholarship_letter`.

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/student/offers/OFFER_ID/submit
```

### `DELETE /api/student/offers/:id`

Soft-removes an offer.

```powershell
curl.exe -i -b student.cookies -X DELETE http://localhost:4000/api/student/offers/OFFER_ID
```

## Master Admin Student Profile Review

### `GET /api/admin/student-profiles`

Lists student profiles. Optional query:
- `status`

Requires a user whose `roles` includes `master_admin`.

For development, create/reset the default Master Admin:

```powershell
corepack pnpm prisma:seed:admin
```

Default credentials:
- Email: `admin@example.com`
- Password: `AdminPassword123!`

```powershell
curl.exe -i -c admin.cookies -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"AdminPassword123!"}'
```

```powershell
curl.exe -i -b admin.cookies "http://localhost:4000/api/admin/student-profiles?status=under_review"
```

### `GET /api/admin/student-profiles/:id`

Returns one student profile for admin review.

```powershell
curl.exe -i -b admin.cookies http://localhost:4000/api/admin/student-profiles/STUDENT_PROFILE_ID
```

### `PATCH /api/admin/student-profiles/:id/review`

Reviews a student profile. Allowed status values:
- `approved`
- `changes_requested`
- `rejected`

```powershell
curl.exe -i -b admin.cookies -X PATCH http://localhost:4000/api/admin/student-profiles/STUDENT_PROFILE_ID/review `
  -H "Content-Type: application/json" `
  -d '{"status":"approved","notes":"Profile reviewed and approved."}'
```

Request changes:

```powershell
curl.exe -i -b admin.cookies -X PATCH http://localhost:4000/api/admin/student-profiles/STUDENT_PROFILE_ID/review `
  -H "Content-Type: application/json" `
  -d '{"status":"changes_requested","notes":"Please upload a clearer ID document."}'
```

```powershell
curl.exe -i -b admin.cookies -X PATCH http://localhost:4000/api/admin/student-profiles/STUDENT_PROFILE_ID/review `
  -H "Content-Type: application/json" `
  -d '{"status":"rejected","notes":"Rejected after review."}'
```

## Admin Offer Review

Master Admin can access all offers. Regional Admin can access only the country in their `RegionalAdminProfile`.

Development Regional Admin:

```powershell
corepack pnpm prisma:seed:regional-admin
```

Default credentials:
- Email: `regional.uk@example.com`
- Password: `RegionalPassword123!`

```powershell
curl.exe -i -c regional.cookies -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"regional.uk@example.com","password":"RegionalPassword123!"}'
```

### `GET /api/admin/offers`

Optional query:
- `status`
- `regionId`

```powershell
curl.exe -i -b admin.cookies "http://localhost:4000/api/admin/offers?status=under_review"
```

### `GET /api/admin/offers/:id`

```powershell
curl.exe -i -b admin.cookies http://localhost:4000/api/admin/offers/OFFER_ID
```

### `PATCH /api/admin/offers/:id/review`

Allowed status values:
- `approved`
- `changes_requested`
- `rejected`

```powershell
curl.exe -i -b admin.cookies -X PATCH http://localhost:4000/api/admin/offers/OFFER_ID/review `
  -H "Content-Type: application/json" `
  -d '{"status":"approved","notes":"Offer verified."}'
```
