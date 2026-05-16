import { DocumentType } from "@prisma/client";

export const allowedDocumentTypes = [
  DocumentType.national_id,
  DocumentType.passport,
  DocumentType.moi_letter,
  DocumentType.consent_form,
  DocumentType.offer_letter,
  DocumentType.scholarship_letter
] as const;

export const profileDocumentTypes = new Set<DocumentType>([
  DocumentType.national_id,
  DocumentType.passport,
  DocumentType.moi_letter,
  DocumentType.consent_form
]);

export const offerDocumentTypes = new Set<DocumentType>([
  DocumentType.offer_letter,
  DocumentType.scholarship_letter
]);

export const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png"
]);

export const allowedFileExtensions = new Set([".pdf", ".jpeg", ".jpg", ".png"]);

export const maxUploadSizeBytes = 5 * 1024 * 1024;
export const localPrivateBucket = "local_private";
export const privateUploadRoot = "uploads/private";
