# Flows

## Student Profile Flow

1. Student registers.
2. System creates a draft student profile.
3. Student uploads required profile documents.
4. Student fills profile fields.
5. Student submits profile.
6. System validates required fields and required documents.
7. Profile moves to `under_review`.
8. Master Admin approves, requests changes, or rejects.

## Profile Statuses

- `draft`
- `under_review`
- `approved`
- `changes_requested`
- `rejected`

## Document Flow

1. Student uploads a profile document.
2. System validates file type, extension, and size.
3. System stores file in local private storage for development.
4. System stores metadata in `Document`.
5. Re-uploading the same document type supersedes the previous active document.

## Admin Review Flow

1. Master Admin lists profiles under review.
2. Master Admin opens profile detail.
3. Master Admin reviews profile fields and documents.
4. Master Admin approves, requests changes, or rejects.
5. System writes an audit log.

## Offer Flow

1. Student must have an `approved` profile before managing offers.
2. Student creates a draft offer with university, course, funding, and visa/living-cost information from `vision/requirements.md`.
3. Student uploads an `offer_letter` for that offer.
4. If scholarship is selected, student also uploads a `scholarship_letter`.
5. Student submits the offer.
6. System validates required documents and moves the offer to `under_review`.
7. Master Admin can review all offers; Regional Admin can review only assigned countries.
8. Approval sets the offer to `approved` and marks the student profile as having a verified offer.
9. Request changes unlocks the offer for student edits.
10. Editing an approved offer creates an `OfferRevision`, locks the offer again, and sends it back to `under_review`.

## Offer Statuses

- `draft`
- `under_review`
- `approved`
- `changes_requested`
- `rejected`
- `removed`

## Future Flows To Document

- Query/alert assignment.
- Mentor support flow.
- Announcements.
- CSV exports.
