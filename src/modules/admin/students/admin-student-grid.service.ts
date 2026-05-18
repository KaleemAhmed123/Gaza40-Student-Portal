import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db/prisma";
import { recordAuditLog } from "../../../shared/audit";
import { toCsv } from "../../../shared/csv";
import { ApiError } from "../../../shared/http";
import type { ListAdminStudentsQuery } from "./admin-student-grid.validation";

type AdminScope =
  | { role: "master_admin"; regionId?: never }
  | { role: "regional_admin"; regionId: string };

async function getAdminScope(userId: string): Promise<AdminScope> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      accountStatus: "active"
    },
    include: { regionalAdminProfile: true }
  });

  if (!user) {
    throw new ApiError(403, "You do not have permission to access students");
  }

  if (user.roles.includes(RoleCode.master_admin)) {
    return { role: "master_admin" };
  }

  if (
    user.roles.includes(RoleCode.regional_admin) &&
    user.regionalAdminProfile?.status === "active" &&
    !user.regionalAdminProfile.deletedAt
  ) {
    return { role: "regional_admin", regionId: user.regionalAdminProfile.regionId };
  }

  throw new ApiError(403, "You do not have permission to access students");
}

function buildSearchWhere(search?: string): Prisma.UserWhereInput {
  if (!search) {
    return {};
  }

  return {
    OR: [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      {
        studentProfile: {
          is: {
            fullNameEnglish: { contains: search, mode: "insensitive" }
          }
        }
      }
    ]
  };
}

function buildMasterWhere(query: ListAdminStudentsQuery): Prisma.UserWhereInput {
  return {
    deletedAt: null,
    roles: { has: RoleCode.student },
    ...buildSearchWhere(query.search),
    studentProfile: {
      is: {
        deletedAt: null,
        ...(query.profileStatus ? { profileStatus: query.profileStatus } : {}),
        ...(query.passportStatus ? { passportStatus: query.passportStatus } : {}),
        ...(query.locationInGaza ? { locationInGaza: query.locationInGaza } : {}),
        ...(query.hasVerifiedOffer === undefined ? {} : { hasVerifiedOffer: query.hasVerifiedOffer }),
        ...(query.consentSigned === undefined ? {} : { consentSigned: query.consentSigned })
      }
    }
  };
}

function buildRegionalWhere(query: ListAdminStudentsQuery, regionId: string): Prisma.UserWhereInput {
  return {
    deletedAt: null,
    roles: { has: RoleCode.student },
    ...buildSearchWhere(query.search),
    studentOffers: {
      some: {
        regionId,
        deletedAt: null
      }
    }
  };
}

export async function listAdminStudents(userId: string, query: ListAdminStudentsQuery) {
  const scope = await getAdminScope(userId);
  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  if (scope.role === "regional_admin") {
    const where = buildRegionalWhere(query, scope.regionId);
    const [students, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          studentProfile: {
            select: {
              dateOfBirth: true
            }
          },
          studentOffers: {
            where: { regionId: scope.regionId, deletedAt: null },
            select: {
              id: true,
              universityName: true,
              courseName: true,
              reviewStatus: true
            },
            orderBy: { updatedAt: "desc" }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);

    return {
      scope,
      students: students.map((student) => ({
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.studentProfile?.dateOfBirth ?? student.dateOfBirth,
        offerCountInRegion: student.studentOffers.length,
        offers: student.studentOffers
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total }
    };
  }

  const where = buildMasterWhere(query);
  const [students, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        createdAt: true,
        accountStatus: true,
        studentProfile: {
          select: {
            id: true,
            fullNameEnglish: true,
            sex: true,
            dateOfBirth: true,
            locationInGaza: true,
            passportStatus: true,
            passportLocation: true,
            consentSigned: true,
            profileStatus: true,
            hasOfferSelfReported: true,
            hasVerifiedOffer: true,
            emergencyContactFirstName: true,
            emergencyContactRelation: true,
            emergencyContactPhone: true
          }
        },
        studentOffers: {
          where: { deletedAt: null },
          select: {
            id: true,
            regionId: true,
            universityName: true,
            reviewStatus: true,
            region: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.user.count({ where })
  ]);

  return {
    scope,
    students: students.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.studentProfile?.dateOfBirth ?? student.dateOfBirth,
      createdAt: student.createdAt,
      accountStatus: student.accountStatus,
      profile: student.studentProfile,
      offerCount: student.studentOffers.length,
      offers: student.studentOffers
    })),
    pagination: { page: query.page, pageSize: query.pageSize, total }
  };
}

export async function exportAdminStudentsCsv(input: {
  userId: string;
  query: ListAdminStudentsQuery;
  ipAddress?: string;
  userAgent?: string;
}) {
  const scope = await getAdminScope(input.userId);
  const where =
    scope.role === "regional_admin"
      ? buildRegionalWhere(input.query, scope.regionId)
      : buildMasterWhere(input.query);

  const students = await prisma.user.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      createdAt: true,
      accountStatus: true,
      studentProfile: {
        select: {
          fullNameEnglish: true,
          sex: true,
          dateOfBirth: true,
          locationInGaza: true,
          passportStatus: true,
          passportLocation: true,
          consentSigned: true,
          profileStatus: true,
          hasOfferSelfReported: true,
          hasVerifiedOffer: true,
          emergencyContactFirstName: true,
          emergencyContactRelation: true,
          emergencyContactPhone: true
        }
      },
      studentOffers: {
        where: {
          deletedAt: null,
          ...(scope.role === "regional_admin" ? { regionId: scope.regionId } : {})
        },
        select: {
          id: true,
          universityName: true,
          courseName: true,
          reviewStatus: true,
          region: { select: { name: true } }
        },
        orderBy: { updatedAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const rows = students.map((student) => ({
    studentId: student.id,
    fullName: student.fullName,
    email: student.email,
    phone: student.phone,
    dateOfBirth: student.studentProfile?.dateOfBirth ?? student.dateOfBirth,
    accountStatus: student.accountStatus,
    profileStatus: student.studentProfile?.profileStatus,
    locationInGaza: student.studentProfile?.locationInGaza,
    passportStatus: student.studentProfile?.passportStatus,
    passportLocation: student.studentProfile?.passportLocation,
    consentSigned: student.studentProfile?.consentSigned,
    hasOfferSelfReported: student.studentProfile?.hasOfferSelfReported,
    hasVerifiedOffer: student.studentProfile?.hasVerifiedOffer,
    emergencyContactName: student.studentProfile?.emergencyContactFirstName,
    emergencyContactRelation: student.studentProfile?.emergencyContactRelation,
    emergencyContactPhone: student.studentProfile?.emergencyContactPhone,
    offerCount: student.studentOffers.length,
    offerRegions: student.studentOffers.map((offer) => offer.region.name),
    offerUniversities: student.studentOffers.map((offer) => offer.universityName),
    offerStatuses: student.studentOffers.map((offer) => offer.reviewStatus),
    createdAt: student.createdAt
  }));

  await recordAuditLog({
    actorUserId: input.userId,
    action: "students_exported",
    entityType: "student",
    metadata: { scope, filters: input.query, rowCount: rows.length },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return toCsv(rows);
}
