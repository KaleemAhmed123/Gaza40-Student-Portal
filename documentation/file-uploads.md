# File Uploads

## Current Storage

- Development storage path: `uploads/private/`
- Files are not served as static public assets.
- File metadata is stored in `Document`.

## Current Limits

- Maximum size: 5MB.
- Allowed extensions:
  - `.pdf`
  - `.jpeg`
  - `.jpg`
  - `.png`
- Allowed MIME types:
  - `application/pdf`
  - `image/jpeg`
  - `image/jpg`
  - `image/png`

## Current Profile Document Types

- `national_id`
- `passport`
- `moi_letter`
- `consent_form`

## Current Offer Document Types

- `offer_letter`
- `scholarship_letter`

## Behavior

- Re-uploading the same document type supersedes the previous active document.
- Consent form upload marks `consentSigned` on the student profile.
- Offer documents require `offerId` in the multipart body.
- Profile documents must not include `offerId`.
- Failed validation or persistence removes the local uploaded file when possible.

## CSV Export File Links

- CSV exports must not include public document URLs.
- For sensitive files such as IDs, passports, consent forms, MOI letters, offer letters, and scholarship letters, use protected API download routes only.
- If exports need file references, include document IDs or protected download paths that still require authenticated access.
- This intentionally differs from a public URL export because the SRS also requires authenticated/private file access.

## Future Production Storage

- Use private S3-compatible object storage.
- Use signed URLs or protected download endpoints.
- Do not expose public document URLs.
