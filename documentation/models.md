# Models

## Purpose

Document database models and important enums. Prisma schema remains the implementation source.

## Current Models

- `User`
- `Region`
- `StudentProfile`
- `VolunteerProfile`
- `RegionalAdminProfile`
- `University`
- `ConfigOption`
- `Document`
- `Offer`
- `OfferRevision`
- `Query`
- `QueryMessage`
- `Announcement`
- `AppConfig`
- `AuthToken`
- `AuditLog`

## Important Enums

- `RoleCode`
- `AccountStatus`
- `ProfileStatus`
- `VolunteerStatus`
- `RegionalAdminStatus`
- `Sex`
- `GazaLocation`
- `PassportStatus`
- `PassportLocation`
- `DocumentType`
- `DocumentStatus`
- `OfferReviewStatus`
- `QueryStatus`
- `AuthTokenType`

## Notes

- Student profile fields live directly on `StudentProfile` for MVP simplicity.
- Fixed user roles live directly on `User.roles` as a `RoleCode[]`.
- Regional admin scope lives on `RegionalAdminProfile.regionId` because one regional admin belongs to exactly one region.
- Profile and offer files use the `Document` model.
- Offer category fields such as course field, course level, and offer type are text fields so they can be driven by `ConfigOption`.
- `Region` and `University` are real master-data tables because they own relationships.
- Offer review status is an enum because it controls backend workflow locking.
- Financial summaries are computed from `Offer` plus the configurable `offer_financial_rules` row in `AppConfig`; they are not stored on the offer.
- Queries use direct assignment fields first instead of separate assignment tables.
- `AuthToken` stores hashed, single-use password reset and email verification tokens.
