import { DocumentStatus, DocumentType, PassportStatus, ProfileStatus } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { recordAuditLog } from "../../shared/audit";
import { ApiError } from "../../shared/http";
import type { updateStudentProfileSchema } from "./student-profile.validation";
import type { z } from "zod";

type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

const editableStatuses = new Set<ProfileStatus>([
  ProfileStatus.draft,
  ProfileStatus.changes_requested
]);

const passportRequiresDocument = new Set<PassportStatus>([
  PassportStatus.valid,
  PassportStatus.valid_expires_within_year
]);

function formatProfile(profile: Awaited<ReturnType<typeof getStudentProfileByUserId>>) {
  return profile;
}

export async function getStudentProfileByUserId(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      documents: {
        where: {
          status: DocumentStatus.active,
          deletedAt: null
        },
        select: {
          id: true,
          documentType: true,
          originalFilename: true,
          mimeType: true,
          fileSizeBytes: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!profile || profile.deletedAt) {
    throw new ApiError(404, "Student profile not found");
  }

  return profile;
}

export async function updateMyStudentProfile(userId: string, input: UpdateStudentProfileInput) {
  const profile = await getStudentProfileByUserId(userId);

  if (!editableStatuses.has(profile.profileStatus)) {
    throw new ApiError(409, "Profile cannot be edited in its current status");
  }

  const updatedProfile = await prisma.studentProfile.update({
    where: { id: profile.id },
    data: input,
    include: {
      documents: {
        where: {
          status: DocumentStatus.active,
          deletedAt: null
        },
        select: {
          id: true,
          documentType: true,
          originalFilename: true,
          mimeType: true,
          fileSizeBytes: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return formatProfile(updatedProfile);
}

function requireProfileField(value: unknown, fieldName: string, missingFields: string[]) {
  if (value === null || value === undefined || value === "") {
    missingFields.push(fieldName);
  }
}

async function getActiveDocumentTypes(studentProfileId: string) {
  const documents = await prisma.document.findMany({
    where: {
      studentProfileId,
      status: DocumentStatus.active,
      deletedAt: null
    },
    select: { documentType: true }
  });

  return new Set(documents.map((document) => document.documentType));
}

export async function submitMyStudentProfile(input: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const profile = await getStudentProfileByUserId(input.userId);

  if (!editableStatuses.has(profile.profileStatus)) {
    throw new ApiError(409, "Profile cannot be submitted in its current status");
  }

  const missingFields: string[] = [];
  requireProfileField(profile.fullNameEnglish, "fullNameEnglish", missingFields);
  requireProfileField(profile.sex, "sex", missingFields);
  requireProfileField(profile.dateOfBirth, "dateOfBirth", missingFields);
  requireProfileField(profile.locationInGaza, "locationInGaza", missingFields);
  requireProfileField(profile.hasOfferSelfReported, "hasOfferSelfReported", missingFields);
  requireProfileField(profile.passportStatus, "passportStatus", missingFields);
  requireProfileField(profile.emergencyContactFirstName, "emergencyContactFirstName", missingFields);
  requireProfileField(profile.emergencyContactRelation, "emergencyContactRelation", missingFields);
  requireProfileField(profile.emergencyContactPhone, "emergencyContactPhone", missingFields);
  requireProfileField(profile.englishMoi, "englishMoi", missingFields);
  requireProfileField(
    profile.englishWorkplaceCertificatePossible,
    "englishWorkplaceCertificatePossible",
    missingFields
  );

  if (profile.locationInGaza === "other") {
    requireProfileField(profile.locationOther, "locationOther", missingFields);
  }

  if (profile.passportStatus && passportRequiresDocument.has(profile.passportStatus)) {
    requireProfileField(profile.passportLocation, "passportLocation", missingFields);
    if (profile.passportLocation === "other") {
      requireProfileField(profile.passportLocationOther, "passportLocationOther", missingFields);
    }
  }

  if (profile.englishMoi) {
    requireProfileField(profile.bachelorUniGaza, "bachelorUniGaza", missingFields);
  }

  const activeDocumentTypes = await getActiveDocumentTypes(profile.id);
  const missingDocuments: string[] = [];

  if (!activeDocumentTypes.has(DocumentType.national_id)) {
    missingDocuments.push(DocumentType.national_id);
  }

  if (!activeDocumentTypes.has(DocumentType.consent_form)) {
    missingDocuments.push(DocumentType.consent_form);
  }

  if (profile.englishMoi && !activeDocumentTypes.has(DocumentType.moi_letter)) {
    missingDocuments.push(DocumentType.moi_letter);
  }

  if (
    profile.passportStatus &&
    passportRequiresDocument.has(profile.passportStatus) &&
    !activeDocumentTypes.has(DocumentType.passport)
  ) {
    missingDocuments.push(DocumentType.passport);
  }

  if (missingFields.length > 0 || missingDocuments.length > 0) {
    throw new ApiError(
      400,
      `Profile is incomplete. Missing fields: ${missingFields.join(", ") || "none"}. Missing documents: ${missingDocuments.join(", ") || "none"}.`
    );
  }

  const submittedProfile = await prisma.studentProfile.update({
    where: { id: profile.id },
    data: {
      profileStatus: ProfileStatus.under_review,
      consentSigned: true,
      reviewNotes: null,
      reviewedAt: null,
      reviewedBy: null
    }
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "student_profile_submitted",
    entityType: "student_profile",
    entityId: profile.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return submittedProfile;
}
