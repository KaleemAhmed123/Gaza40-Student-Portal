import { DocumentStatus, DocumentType, PassportStatus, ProfileStatus, RoleCode } from "../../db/models/enums";
import {
  studentProfileRepository,
  documentRepository,
  userRepository
} from "../../db/repositories";
import { recordAuditLog } from "../../shared/audit";
import { ApiError } from "../../shared/http";
import { notifyMasterAdminsOfProfileSubmission } from "../../shared/review-email";
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

function formatProfile(profile: any) {
  return profile;
}

export async function getStudentProfileByUserId(userId: string) {
  let profile = await studentProfileRepository.findOne({ userId }, null, true);

  if (profile && profile.deletedAt) {
    profile = await studentProfileRepository.update(
      profile.id,
      { deletedAt: null },
      true
    );
  }

  if (!profile) {
    const user = await userRepository.findOne({
      _id: userId,
      roles: RoleCode.student
    });

    if (!user) {
      throw new ApiError(404, "Student profile not found");
    }

    profile = await studentProfileRepository.create({
      userId,
      hasOfferSelfReported: false
    });
  }

  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }

  // Fetch active documents to embed them in the returned profile object
  const documents = await documentRepository.find(
    {
      studentProfileId: profile.id,
      status: DocumentStatus.active
    },
    { sort: { createdAt: -1 } }
  );

  const profileObj = profile.toObject ? profile.toObject() : profile;
  profileObj.documents = documents.map((d) => ({
    id: d.id,
    documentType: d.documentType,
    originalFilename: d.originalFilename,
    mimeType: d.mimeType,
    fileSizeBytes: d.fileSizeBytes,
    createdAt: d.createdAt
  }));

  return profileObj;
}

export async function updateMyStudentProfile(userId: string, input: UpdateStudentProfileInput) {
  const profile = await getStudentProfileByUserId(userId);

  if (!editableStatuses.has(profile.profileStatus)) {
    throw new ApiError(409, "Profile cannot be edited in its current status");
  }

  const updatedProfile = await studentProfileRepository.update(profile.id, input);

  if (!updatedProfile) {
    throw new ApiError(404, "Student profile not found");
  }

  // Fetch active documents
  const documents = await documentRepository.find(
    {
      studentProfileId: updatedProfile.id,
      status: DocumentStatus.active
    },
    { sort: { createdAt: -1 } }
  );

  const profileObj = updatedProfile.toObject ? updatedProfile.toObject() : updatedProfile;
  profileObj.documents = documents.map((d) => ({
    id: d.id,
    documentType: d.documentType,
    originalFilename: d.originalFilename,
    mimeType: d.mimeType,
    fileSizeBytes: d.fileSizeBytes,
    createdAt: d.createdAt
  }));

  return formatProfile(profileObj);
}

function requireProfileField(value: unknown, fieldName: string, missingFields: string[]) {
  if (value === null || value === undefined || value === "") {
    missingFields.push(fieldName);
  }
}

async function getActiveDocumentTypes(studentProfileId: string) {
  const documents = await documentRepository.find({
    studentProfileId,
    status: DocumentStatus.active
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
  requireProfileField(profile.consentSigned, "consentSigned", missingFields);
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

  const missingDocuments: string[] = [];

  const activeDocumentTypes = await getActiveDocumentTypes(profile.id);
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

  const submittedProfile = await studentProfileRepository.update(profile.id, {
    profileStatus: ProfileStatus.under_review,
    consentSigned: true,
    reviewNotes: null,
    reviewedAt: null,
    reviewedBy: null
  });

  if (!submittedProfile) {
    throw new ApiError(404, "Student profile not found");
  }

  await recordAuditLog({
    actorUserId: input.userId,
    action: "student_profile_submitted",
    entityType: "student_profile",
    entityId: profile.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  const student = await userRepository.findOne({ _id: input.userId });

  if (student) {
    void notifyMasterAdminsOfProfileSubmission({
      studentName: student.fullName,
      studentEmail: student.email
    }).catch((error) => {
      console.error(
        `Profile review email notification failed: ${error instanceof Error ? error.message : "Unknown notification error"}`
      );
    });
  }

  return submittedProfile;
}
