# Testing

## Automated Checks

```powershell
corepack pnpm lint
corepack pnpm build
```

## Database Checks

```powershell
corepack pnpm prisma:generate
corepack pnpm prisma:push
corepack pnpm prisma:seed
```

## Manual Smoke Tests

All examples assume the API is running at `http://localhost:4000`.

### Health

- `GET /health`
- `GET /health/db`

```powershell
curl.exe -i http://localhost:4000/health
curl.exe -i http://localhost:4000/health/db
```

### Auth

- Register student.
- Register volunteer.
- Login.
- Call `/api/auth/me`.
- Logout.

```powershell
curl.exe -i -c student.cookies -X POST http://localhost:4000/api/auth/register/student `
  -H "Content-Type: application/json" `
  -d '{"email":"student1@example.com","password":"Password123!","fullName":"Student One","hasOfferSelfReported":true}'
```

```powershell
curl.exe -i -b student.cookies http://localhost:4000/api/auth/me
```

### Student Profile

- Get current profile.
- Patch draft profile.
- Submit profile and confirm status becomes `under_review`.
- Submit without required profile documents must fail.
- Upload consent and national ID before a successful submission.
- Confirm approved profile cannot be edited through draft update.

```powershell
curl.exe -i -b student.cookies http://localhost:4000/api/student/profile/me
```

```powershell
curl.exe -i -b student.cookies -X PATCH http://localhost:4000/api/student/profile/me `
  -H "Content-Type: application/json" `
  -d '{"fullNameEnglish":"Student One","sex":"male","dateOfBirth":"2000-01-15","locationInGaza":"gaza_city","hasOfferSelfReported":true,"passportStatus":"invalid_lost_never_had_one","emergencyContactFirstName":"Emergency","emergencyContactRelation":"Parent","emergencyContactPhone":"+970599111111","englishMoi":false,"englishWorkplaceCertificatePossible":false}'
```

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/student/profile/me/submit
```

### Documents

- Upload invalid file type and confirm it fails.
- Upload over 5MB and confirm it fails.
- Upload valid profile document and confirm metadata is returned.
- Download own document.
- Confirm another student cannot download the document.

Create test files first, or replace these paths with real files:

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

After consent and national ID are uploaded, profile submission should still work:

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/student/profile/me/submit
```

### Master Admin Review

- Non-admin cannot list profiles.
- Master Admin can list under-review profiles.
- Master Admin can approve a profile.
- Master Admin can request changes.
- Master Admin can reject a profile.

Create or reset the development Master Admin:

```powershell
corepack pnpm prisma:seed:admin
```

Default credentials:
- Email: `admin@example.com`
- Password: `AdminPassword123!`

Then log in:

```powershell
curl.exe -i -c admin.cookies -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"AdminPassword123!"}'
```

List profiles under review:

```powershell
curl.exe -i -b admin.cookies "http://localhost:4000/api/admin/student-profiles?status=under_review"
```

Approve one:

```powershell
curl.exe -i -b admin.cookies -X PATCH http://localhost:4000/api/admin/student-profiles/STUDENT_PROFILE_ID/review `
  -H "Content-Type: application/json" `
  -d '{"status":"approved","notes":"Profile reviewed and approved."}'
```

### Config / Master Data

- Regions can be read publicly.
- Config options can be read publicly.
- Universities can be searched publicly.
- Only Master Admin can create/update/deactivate config records.

```powershell
curl.exe -i http://localhost:4000/api/config/regions
curl.exe -i "http://localhost:4000/api/config/options?groupKey=course_field"
curl.exe -i "http://localhost:4000/api/config/universities?search=example"
```

```powershell
curl.exe -i -b admin.cookies -X POST http://localhost:4000/api/admin/config/options `
  -H "Content-Type: application/json" `
  -d '{"groupKey":"course_field","value":"business","labelEn":"Business","sortOrder":50}'
```

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/admin/config/options `
  -H "Content-Type: application/json" `
  -d '{"groupKey":"course_field","value":"should_fail","labelEn":"Should Fail"}'
```

## Complete Current Flow

1. Start API.
2. Register student and keep cookies in `student.cookies`.
3. Patch student profile.
4. Upload `consent_form` and `national_id` before profile submission.
5. Submit profile.
6. Seed the development Master Admin.
7. Login admin and keep cookies in `admin.cookies`.
8. List under-review profiles.
9. Approve/request changes/reject profile.
10. Use the Postman collection overview for the full end-to-end story covering offers, queries, announcements, dashboards, exports, audit logs, and negative security checks.

## Offer Smoke Test

This flow assumes the student profile has already been approved.

Offer creation accepts `universityId`, `regionId`, or `universityCountry`. The example uses `universityCountry` because it is easiest for manual curl testing.

Create a draft UK offer:

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/student/offers `
  -H "Content-Type: application/json" `
  -d '{"universityCountry":"UK","universityName":"Example University","courseName":"MSc Public Health","courseField":"Public Health","courseLevel":"Masters","durationYears":2.5,"programmeStartDate":"2026-09-01","offerType":"Conditional","conditions":"Final transcript required","tuitionFeePerYear":12000,"courseFeeSourceUrl":"https://example.edu/fees","hasScholarship":false,"scholarshipCoversLivingCost":false,"privateFundingAmount":13000,"privateFundingSource":"Family support","livingCostLocationKey":"outside_london"}'
```

Upload the required offer letter:

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/documents `
  -F "documentType=offer_letter" `
  -F "offerId=OFFER_ID" `
  -F "file=@C:\tmp\offer-letter.pdf"
```

Submit the offer:

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/student/offers/OFFER_ID/submit
```

Seed and login the UK Regional Admin:

```powershell
corepack pnpm prisma:seed:regional-admin
curl.exe -i -c regional.cookies -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"regional.uk@example.com","password":"RegionalPassword123!"}'
```

Review the offer:

```powershell
curl.exe -i -b regional.cookies "http://localhost:4000/api/admin/offers?status=under_review"
curl.exe -i -b regional.cookies -X PATCH http://localhost:4000/api/admin/offers/OFFER_ID/review `
  -H "Content-Type: application/json" `
  -d '{"status":"approved","notes":"Offer checked for UK region."}'
```

## Offer Security Checks

These should fail:

```powershell
curl.exe -i -b student.cookies "http://localhost:4000/api/admin/offers?status=under_review"
```

```powershell
curl.exe -i -b student.cookies -X POST http://localhost:4000/api/student/offers/OFFER_ID/submit
```

The second command should fail before an `offer_letter` is uploaded. If `hasScholarship=true`, submission should also fail until a `scholarship_letter` is uploaded.
