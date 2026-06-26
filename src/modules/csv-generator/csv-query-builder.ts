import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { StudentCsvBody, MentorCsvBody, RegionalAdminCsvBody } from "./csv-generator.validation";

export type CsvScope =
  | { role: "master_admin"; regionId?: never }
  | { role: "regional_admin"; regionId: string };

// ─── Student where ────────────────────────────────────────────────────────────

export function buildStudentWhere(
  body: StudentCsvBody,
  scope: CsvScope
): Prisma.UserWhereInput {
  const filters = body.filters ?? {};
  const regionId = scope.role === "regional_admin" ? scope.regionId : filters.regionId;

  const dateFilter: Prisma.UserWhereInput = body.dateRangeField === "studentSignupDate"
    ? { createdAt: { gte: body.dateRangeFrom, lte: body.dateRangeTo } }
    : {};

  const offerDateFilter: Prisma.OfferWhereInput = body.dateRangeField === "offerCreatedAt"
    ? { createdAt: { gte: body.dateRangeFrom, lte: body.dateRangeTo } }
    : {};

  return {
    deletedAt: null,
    roles: { has: RoleCode.student },
    ...dateFilter,
    studentProfile: { is: { deletedAt: null } },
    studentOffers: {
      some: {
        deletedAt: null,
        ...(regionId ? { regionId } : {}),
        ...(filters.universityId ? { universityId: filters.universityId } : {}),
        ...(filters.scholarshipName ? { scholarshipName: { contains: filters.scholarshipName, mode: "insensitive" } } : {}),
        ...(filters.approvedOffer !== undefined ? { reviewStatus: filters.approvedOffer ? "approved" : { not: "approved" as const } } : {}),
        ...offerDateFilter,
      },
    },
  };
}

// ─── Mentor where (paginates over Offer table) ────────────────────────────────

export function buildMentorOfferWhere(
  body: MentorCsvBody,
  scope: CsvScope
): Prisma.OfferWhereInput {
  const filters = body.filters ?? {};
  const regionId = scope.role === "regional_admin" ? scope.regionId : filters.regionId;

  const offerDateFilter: Prisma.OfferWhereInput = body.dateRangeField === "offerCreatedAt"
    ? { createdAt: { gte: body.dateRangeFrom, lte: body.dateRangeTo } }
    : {};

  const mentorSignupFilter: Prisma.UserWhereInput = body.dateRangeField === "mentorSignupDate"
    ? { createdAt: { gte: body.dateRangeFrom, lte: body.dateRangeTo } }
    : {};

  return {
    deletedAt: null,
    mentorId: { not: null },
    ...(regionId ? { regionId } : {}),
    ...(filters.universityId ? { universityId: filters.universityId } : {}),
    ...(filters.approvedOffer !== undefined ? { reviewStatus: filters.approvedOffer ? "approved" : { not: "approved" as const } } : {}),
    ...offerDateFilter,
    mentor: {
      deletedAt: null,
      roles: { has: RoleCode.mentor },
      ...mentorSignupFilter,
    },
  };
}

// ─── Regional Admin offer where ───────────────────────────────────────────────

export function buildRegionalAdminOfferWhere(
  body: RegionalAdminCsvBody,
  scope: CsvScope
): Prisma.OfferWhereInput {
  const filters = body.filters ?? {};
  const regionId = scope.role === "regional_admin" ? scope.regionId : filters.regionId;

  const offerDateFilter: Prisma.OfferWhereInput = body.dateRangeField === "offerCreatedAt"
    ? { createdAt: { gte: body.dateRangeFrom, lte: body.dateRangeTo } }
    : {};

  return {
    deletedAt: null,
    ...(regionId ? { regionId } : {}),
    ...(filters.universityId ? { universityId: filters.universityId } : {}),
    ...(filters.approvedOffer !== undefined ? { reviewStatus: filters.approvedOffer ? "approved" : { not: "approved" as const } } : {}),
    ...offerDateFilter,
  };
}
