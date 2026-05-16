import { DocumentStatus, DocumentType, OfferReviewStatus, Prisma, ProfileStatus, RoleCode } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { recordAuditLog } from "../../shared/audit";
import { ApiError } from "../../shared/http";
import {
  calculateOfferFinancialSummary,
  decimalToNumber,
  parseFinancialRules
} from "./offer-financial";
import type { listAdminOffersQuerySchema, offerInputSchema, reviewOfferSchema } from "./offer.validation";
import type { z } from "zod";

type OfferInput = z.infer<typeof offerInputSchema>;
type ListAdminOffersQuery = z.infer<typeof listAdminOffersQuerySchema>;
type ReviewOfferInput = z.infer<typeof reviewOfferSchema>;

const offerInclude = {
  region: true,
  university: true,
  documents: {
    where: { status: DocumentStatus.active, deletedAt: null },
    select: {
      id: true,
      documentType: true,
      originalFilename: true,
      mimeType: true,
      fileSizeBytes: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" as const }
  }
};

const editableOfferStatuses = new Set<OfferReviewStatus>([
  OfferReviewStatus.draft,
  OfferReviewStatus.changes_requested,
  OfferReviewStatus.approved
]);

function snapshotValue(value: unknown): Prisma.JsonValue {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === undefined) {
    return null;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof (value as { toString?: unknown }).toString === "function") {
    return (value as { toString: () => string }).toString();
  }

  return null;
}

function offerSnapshot(offer: Record<string, unknown>): Prisma.JsonObject {
  return {
    regionId: snapshotValue(offer.regionId),
    universityId: snapshotValue(offer.universityId),
    universityName: snapshotValue(offer.universityName),
    courseName: snapshotValue(offer.courseName),
    courseField: snapshotValue(offer.courseField),
    courseLevel: snapshotValue(offer.courseLevel),
    durationYears: snapshotValue(offer.durationYears),
    programmeStartDate: snapshotValue(offer.programmeStartDate),
    offerType: snapshotValue(offer.offerType),
    conditions: snapshotValue(offer.conditions),
    tuitionFeePerYear: snapshotValue(offer.tuitionFeePerYear),
    courseFeeSourceUrl: snapshotValue(offer.courseFeeSourceUrl),
    hasScholarship: snapshotValue(offer.hasScholarship),
    scholarshipName: snapshotValue(offer.scholarshipName),
    scholarshipAmountPerYear: snapshotValue(offer.scholarshipAmountPerYear),
    scholarshipCoversLivingCost: snapshotValue(offer.scholarshipCoversLivingCost),
    privateFundingAmount: snapshotValue(offer.privateFundingAmount),
    privateFundingSource: snapshotValue(offer.privateFundingSource),
    livingCostLocationKey: snapshotValue(offer.livingCostLocationKey),
    livingCostForVisa: snapshotValue(offer.livingCostForVisa),
    boardingFees: snapshotValue(offer.boardingFees)
  };
}

function changedFields(beforeData: Record<string, unknown>, afterData: Record<string, unknown>) {
  return Object.keys(afterData).filter(
    (key) => JSON.stringify(beforeData[key]) !== JSON.stringify(afterData[key])
  );
}

async function getApprovedStudentProfile(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });

  if (!profile || profile.deletedAt) {
    throw new ApiError(404, "Student profile not found");
  }

  if (profile.profileStatus !== ProfileStatus.approved) {
    throw new ApiError(403, "Student profile must be approved before managing offers");
  }

  return profile;
}

async function getOfferFinancialRules() {
  const config = await prisma.appConfig.findUnique({
    where: { key: "offer_financial_rules" }
  });

  if (!config) {
    throw new ApiError(500, "Offer financial rules config is missing");
  }

  return parseFinancialRules(config.value);
}

async function formatOffer(offer: Prisma.OfferGetPayload<{ include: typeof offerInclude }>) {
  const rules = await getOfferFinancialRules();
  const summary = calculateOfferFinancialSummary(rules, {
    countryName: offer.region.name,
    courseLevel: offer.courseLevel,
    durationYears: decimalToNumber(offer.durationYears),
    tuitionFeePerYear: decimalToNumber(offer.tuitionFeePerYear),
    scholarshipAmountPerYear: offer.scholarshipAmountPerYear
      ? decimalToNumber(offer.scholarshipAmountPerYear)
      : undefined,
    scholarshipCoversLivingCost: offer.scholarshipCoversLivingCost,
    privateFundingAmount: decimalToNumber(offer.privateFundingAmount),
    livingCostLocationKey: offer.livingCostLocationKey,
    livingCostForVisa: offer.livingCostForVisa ? decimalToNumber(offer.livingCostForVisa) : undefined,
    boardingFees: offer.boardingFees ? decimalToNumber(offer.boardingFees) : undefined
  });

  return { ...offer, financialSummary: summary };
}

function toOfferData(input: OfferInput) {
  return {
    universityName: input.universityName,
    courseName: input.courseName,
    courseField: input.courseField,
    courseLevel: input.courseLevel,
    durationYears: input.durationYears,
    programmeStartDate: input.programmeStartDate,
    offerType: input.offerType,
    conditions: input.conditions,
    tuitionFeePerYear: input.tuitionFeePerYear,
    courseFeeSourceUrl: input.courseFeeSourceUrl,
    hasScholarship: input.hasScholarship,
    scholarshipName: input.scholarshipName,
    scholarshipAmountPerYear: input.scholarshipAmountPerYear,
    scholarshipCoversLivingCost: input.scholarshipCoversLivingCost,
    privateFundingAmount: input.privateFundingAmount,
    privateFundingSource: input.privateFundingSource,
    livingCostLocationKey: input.livingCostLocationKey,
    livingCostForVisa: input.livingCostForVisa,
    boardingFees: input.boardingFees
  };
}

async function resolveOfferRegionAndUniversity(
  input: Pick<OfferInput, "regionId" | "universityId" | "universityCountry">
) {
  if (input.universityId) {
    const university = await prisma.university.findFirst({
      where: { id: input.universityId, isActive: true, deletedAt: null },
      include: { region: true }
    });

    if (!university || !university.region.isActive || university.region.deletedAt) {
      throw new ApiError(400, "Invalid university");
    }

    return { region: university.region, university };
  }

  const region = await prisma.region.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
      ...(input.regionId
        ? { id: input.regionId }
        : { name: { equals: input.universityCountry, mode: "insensitive" } })
    }
  });

  if (!region) {
    throw new ApiError(400, "Invalid university country");
  }

  return { region, university: null };
}

function isResidentialSchool(courseLevel: string) {
  return courseLevel.trim().toLowerCase() === "residential independent school";
}

async function validateOfferBusinessRules(input: OfferInput, regionCountryName: string) {
  const rules = await getOfferFinancialRules();

  if (input.offerType.trim().toLowerCase() === "conditional" && !input.conditions) {
    throw new ApiError(400, "Conditions are required for conditional offers");
  }

  if (input.hasScholarship && (!input.scholarshipName || input.scholarshipAmountPerYear === undefined)) {
    throw new ApiError(400, "Scholarship name and amount are required when scholarship is selected");
  }

  if (!input.hasScholarship && (input.scholarshipName || input.scholarshipAmountPerYear !== undefined)) {
    throw new ApiError(400, "Scholarship fields require hasScholarship to be true");
  }

  if (isResidentialSchool(input.courseLevel) && input.boardingFees === undefined) {
    throw new ApiError(400, "Boarding fees are required for residential independent school offers");
  }

  if (!isResidentialSchool(input.courseLevel) && regionCountryName.toLowerCase() === "uk") {
    const ukRules = rules.livingCostRules.UK ?? {};
    if (!input.livingCostLocationKey || !ukRules[input.livingCostLocationKey]) {
      throw new ApiError(400, "Valid UK living cost location is required");
    }
  }

  if (!isResidentialSchool(input.courseLevel) && regionCountryName.toLowerCase() !== "uk") {
    if (input.livingCostForVisa === undefined) {
      throw new ApiError(400, "Living cost for visa is required for non-UK offers");
    }
  }
}

export async function listMyOffers(userId: string) {
  await getApprovedStudentProfile(userId);
  const offers = await prisma.offer.findMany({
    where: { studentUserId: userId, deletedAt: null },
    include: offerInclude,
    orderBy: { updatedAt: "desc" }
  });

  return Promise.all(offers.map(formatOffer));
}

export async function getMyOffer(userId: string, offerId: string) {
  await getApprovedStudentProfile(userId);
  const offer = await prisma.offer.findFirst({
    where: { id: offerId, studentUserId: userId, deletedAt: null },
    include: offerInclude
  });

  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  return formatOffer(offer);
}

export async function createMyOffer(userId: string, input: OfferInput) {
  await getApprovedStudentProfile(userId);
  const { region, university } = await resolveOfferRegionAndUniversity(input);
  await validateOfferBusinessRules(input, region.name);

  const offer = await prisma.offer.create({
    data: {
      studentUserId: userId,
      regionId: region.id,
      universityId: university?.id,
      ...toOfferData(input)
    },
    include: offerInclude
  });

  return formatOffer(offer);
}

export async function updateMyOffer(input: {
  userId: string;
  offerId: string;
  data: OfferInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  await getApprovedStudentProfile(input.userId);
  const existingOffer = await prisma.offer.findFirst({
    where: { id: input.offerId, studentUserId: input.userId, deletedAt: null }
  });

  if (!existingOffer) {
    throw new ApiError(404, "Offer not found");
  }

  if (!editableOfferStatuses.has(existingOffer.reviewStatus)) {
    throw new ApiError(409, "Offer cannot be edited in its current status");
  }

  const { region, university } = await resolveOfferRegionAndUniversity(input.data);
  await validateOfferBusinessRules(input.data, region.name);

  const beforeData = offerSnapshot(existingOffer);
  const nextData = { regionId: region.id, universityId: university?.id, ...toOfferData(input.data) };
  const afterData = offerSnapshot({ ...existingOffer, ...nextData });
  const fieldsChanged = changedFields(beforeData, afterData);
  const editedApprovedOffer = existingOffer.reviewStatus === OfferReviewStatus.approved;

  const offer = await prisma.$transaction(async (tx) => {
    const updatedOffer = await tx.offer.update({
      where: { id: existingOffer.id },
      data: {
        ...nextData,
        ...(editedApprovedOffer
          ? {
              reviewStatus: OfferReviewStatus.under_review,
              lockedForReview: true,
              reviewedAt: null,
              reviewedBy: null,
              reviewNotes: null
            }
          : {})
      },
      include: offerInclude
    });

    if (editedApprovedOffer) {
      await tx.offerRevision.create({
        data: {
          offerId: existingOffer.id,
          editedBy: input.userId,
          beforeData,
          afterData,
          changedFields: fieldsChanged
        }
      });
    }

    return updatedOffer;
  });

  if (editedApprovedOffer) {
    await recordAuditLog({
      actorUserId: input.userId,
      action: "approved_offer_edited",
      entityType: "offer",
      entityId: existingOffer.id,
      metadata: { changedFields: fieldsChanged },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    });
  }

  return formatOffer(offer);
}

export async function removeMyOffer(input: {
  userId: string;
  offerId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await getApprovedStudentProfile(input.userId);
  const offer = await prisma.offer.findFirst({
    where: { id: input.offerId, studentUserId: input.userId, deletedAt: null }
  });

  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  const removedOffer = await prisma.offer.update({
    where: { id: offer.id },
    data: {
      reviewStatus: OfferReviewStatus.removed,
      deletedAt: new Date()
    }
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "offer_removed",
    entityType: "offer",
    entityId: offer.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return removedOffer;
}

export async function submitMyOffer(input: {
  userId: string;
  offerId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await getApprovedStudentProfile(input.userId);
  const offer = await prisma.offer.findFirst({
    where: { id: input.offerId, studentUserId: input.userId, deletedAt: null },
    include: { documents: { where: { status: DocumentStatus.active, deletedAt: null } } }
  });

  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  if (
    offer.reviewStatus !== OfferReviewStatus.draft &&
    offer.reviewStatus !== OfferReviewStatus.changes_requested
  ) {
    throw new ApiError(409, "Offer cannot be submitted in its current status");
  }

  const hasOfferLetter = offer.documents.some(
    (document) => document.documentType === DocumentType.offer_letter
  );
  if (!hasOfferLetter) {
    throw new ApiError(400, "Offer letter is required before submitting an offer");
  }

  const hasScholarshipLetter = offer.documents.some(
    (document) => document.documentType === DocumentType.scholarship_letter
  );
  if (offer.hasScholarship && !hasScholarshipLetter) {
    throw new ApiError(400, "Scholarship letter is required when scholarship is selected");
  }

  const submittedOffer = await prisma.offer.update({
    where: { id: offer.id },
    data: {
      reviewStatus: OfferReviewStatus.under_review,
      lockedForReview: true,
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null
    },
    include: offerInclude
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: "offer_submitted",
    entityType: "offer",
    entityId: offer.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return formatOffer(submittedOffer);
}

async function canReviewOffer(userId: string, regionId: string) {
  const masterAdmin = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      accountStatus: "active",
      roles: { has: RoleCode.master_admin }
    }
  });

  if (masterAdmin) {
    return true;
  }

  const regionalAdmin = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      accountStatus: "active",
      roles: { has: RoleCode.regional_admin },
      regionalAdminProfile: {
        regionId,
        status: "active",
        deletedAt: null
      }
    }
  });

  return Boolean(regionalAdmin);
}

export async function listAdminOffers(userId: string, query: ListAdminOffersQuery) {
  const masterAdmin = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      accountStatus: "active",
      roles: { has: RoleCode.master_admin }
    }
  });

  let assignedRegionId: string | undefined;
  if (!masterAdmin) {
    const regionalAdmin = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        accountStatus: "active",
        roles: { has: RoleCode.regional_admin }
      },
      include: { regionalAdminProfile: true }
    });

    if (!regionalAdmin?.regionalAdminProfile || regionalAdmin.regionalAdminProfile.status !== "active") {
      throw new ApiError(403, "You do not have permission to access offers");
    }

    assignedRegionId = regionalAdmin.regionalAdminProfile.regionId;
  }

  const offers = await prisma.offer.findMany({
    where: {
      deletedAt: null,
      ...(query.status ? { reviewStatus: query.status } : {}),
      ...(query.regionId ? { regionId: query.regionId } : {}),
      ...(masterAdmin ? {} : { regionId: assignedRegionId })
    },
    include: offerInclude,
    orderBy: { updatedAt: "desc" }
  });

  return Promise.all(offers.map(formatOffer));
}

export async function getAdminOffer(userId: string, offerId: string) {
  const offer = await prisma.offer.findFirst({
    where: { id: offerId, deletedAt: null },
    include: offerInclude
  });

  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  if (!(await canReviewOffer(userId, offer.regionId))) {
    throw new ApiError(403, "You do not have permission to access this offer");
  }

  return formatOffer(offer);
}

export async function reviewOffer(input: {
  userId: string;
  offerId: string;
  data: ReviewOfferInput;
  ipAddress?: string;
  userAgent?: string;
}) {
  const offer = await prisma.offer.findFirst({
    where: { id: input.offerId, deletedAt: null }
  });

  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }

  if (!(await canReviewOffer(input.userId, offer.regionId))) {
    throw new ApiError(403, "You do not have permission to review this offer");
  }

  if (offer.reviewStatus !== OfferReviewStatus.under_review) {
    throw new ApiError(409, "Only offers under review can be reviewed");
  }

  const nextStatus = input.data.status as OfferReviewStatus;
  const reviewedOffer = await prisma.$transaction(async (tx) => {
    const updatedOffer = await tx.offer.update({
      where: { id: offer.id },
      data: {
        reviewStatus: nextStatus,
        lockedForReview: nextStatus === OfferReviewStatus.approved || nextStatus === OfferReviewStatus.rejected,
        reviewedBy: input.userId,
        reviewedAt: new Date(),
        reviewNotes: input.data.notes
      },
      include: offerInclude
    });

    if (nextStatus === OfferReviewStatus.approved) {
      await tx.studentProfile.update({
        where: { userId: offer.studentUserId },
        data: { hasVerifiedOffer: true }
      });
    }

    return updatedOffer;
  });

  await recordAuditLog({
    actorUserId: input.userId,
    action: `offer_${input.data.status}`,
    entityType: "offer",
    entityId: offer.id,
    metadata: { notesProvided: Boolean(input.data.notes) },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return formatOffer(reviewedOffer);
}
