export enum RoleCode {
  student = "student",
  mentor = "mentor",
  regional_admin = "regional_admin",
  master_admin = "master_admin"
}

export enum AccountStatus {
  pending = "pending",
  active = "active",
  disabled = "disabled",
  rejected = "rejected"
}

export enum ProfileStatus {
  draft = "draft",
  submitted = "submitted",
  under_review = "under_review",
  approved = "approved",
  changes_requested = "changes_requested",
  rejected = "rejected"
}

export enum VolunteerStatus {
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
  inactive = "inactive"
}

export enum RegionalAdminStatus {
  active = "active",
  inactive = "inactive"
}

export enum Sex {
  male = "male",
  female = "female"
}

export enum GazaLocation {
  deir_al_balah = "deir_al_balah",
  bureij = "bureij",
  north_gaza = "north_gaza",
  gaza_city = "gaza_city",
  nuseirat = "nuseirat",
  zawaidah = "zawaidah",
  maghazi = "maghazi",
  khan_yunis = "khan_yunis",
  other = "other"
}

export enum PassportStatus {
  valid = "valid",
  valid_expires_within_year = "valid_expires_within_year",
  invalid_lost_never_had_one = "invalid_lost_never_had_one"
}

export enum PassportLocation {
  in_gaza_with_me = "in_gaza_with_me",
  egypt = "egypt",
  ramallah = "ramallah",
  jordan = "jordan",
  other = "other"
}

export enum DocumentType {
  national_id = "national_id",
  passport = "passport",
  moi_letter = "moi_letter",
  consent_form = "consent_form",
  offer_letter = "offer_letter",
  scholarship_letter = "scholarship_letter",
  signature = "signature",
  english_proficiency = "english_proficiency"
}

export enum DocumentStatus {
  active = "active",
  superseded = "superseded",
  deleted = "deleted",
  failed_scan = "failed_scan"
}

export enum OfferReviewStatus {
  draft = "draft",
  under_review = "under_review",
  approved = "approved",
  changes_requested = "changes_requested",
  rejected = "rejected",
  removed = "removed"
}

export enum QueryStatus {
  open = "open",
  assigned = "assigned", // Maps to in_progress in Prisma Alert
  resolved = "resolved"
}

export enum AuthTokenType {
  password_reset = "password_reset",
  email_verification = "email_verification"
}
