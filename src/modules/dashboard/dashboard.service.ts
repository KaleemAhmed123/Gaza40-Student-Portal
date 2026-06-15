import { OfferReviewStatus, QueryStatus, RoleCode } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../shared/http";

type AdminScope =
  | { role: "master_admin"; regionId?: never; regionName?: never }
  | { role: "regional_admin"; regionId: string; regionName: string };

function countRows<T extends string>(rows: Array<{ key: T; count: number }>) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.key] = row.count;
    return acc;
  }, {});
}

function groupCount(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object") {
    const count = (value as { id?: unknown; _all?: unknown }).id ?? (value as { _all?: unknown })._all;
    return typeof count === "number" ? count : 0;
  }

  return 0;
}

async function getAdminScope(userId: string): Promise<AdminScope> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, accountStatus: "active" },
    include: {
      regionalAdminProfile: {
        include: { region: true }
      }
    }
  });

  if (!user) {
    throw new ApiError(403, "You do not have permission to access dashboard");
  }

  if (user.roles.includes(RoleCode.master_admin)) {
    return { role: "master_admin" };
  }

  if (
    user.roles.includes(RoleCode.regional_admin) &&
    user.regionalAdminProfile?.status === "active" &&
    !user.regionalAdminProfile.deletedAt
  ) {
    return {
      role: "regional_admin",
      regionId: user.regionalAdminProfile.regionId,
      regionName: user.regionalAdminProfile.region.name
    };
  }

  throw new ApiError(403, "You do not have permission to access dashboard");
}

export async function getStudentDashboard(userId: string) {
  const [profile, offerCounts, queryCounts, recentOffers, recentQueries, latestAnnouncements] =
    await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId },
        select: {
          profileStatus: true,
          consentSigned: true,
          hasOfferSelfReported: true,
          hasVerifiedOffer: true,
          passportStatus: true,
          locationInGaza: true,
          reviewNotes: true
        }
      }),
      prisma.offer.groupBy({
        by: ["reviewStatus"],
        where: { studentUserId: userId, deletedAt: null },
        orderBy: { reviewStatus: "asc" },
        _count: { id: true }
      }),
      prisma.query.groupBy({
        by: ["status"],
        where: { studentUserId: userId, deletedAt: null },
        orderBy: { status: "asc" },
        _count: { id: true }
      }),
      prisma.offer.findMany({
        where: { studentUserId: userId, deletedAt: null },
        select: {
          id: true,
          universityName: true,
          courseName: true,
          reviewStatus: true,
          updatedAt: true
        },
        orderBy: { updatedAt: "desc" },
        take: 5
      }),
      prisma.query.findMany({
        where: { studentUserId: userId, deletedAt: null },
        select: {
          id: true,
          title: true,
          queryType: true,
          status: true,
          updatedAt: true
        },
        orderBy: { updatedAt: "desc" },
        take: 5
      }),
      prisma.announcement.findMany({
        where: { deletedAt: null, isPublished: true },
        select: {
          id: true,
          title: true,
          category: true,
          publishedAt: true,
          createdAt: true
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 5
      })
    ]);

  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }

  return {
    profile,
    counts: {
      offersByStatus: countRows(
        offerCounts.map((row) => ({ key: row.reviewStatus, count: groupCount(row._count) }))
      ),
      queriesByStatus: countRows(
        queryCounts.map((row) => ({ key: row.status, count: groupCount(row._count) }))
      )
    },
    recent: {
      offers: recentOffers,
      queries: recentQueries,
      announcements: latestAnnouncements
    }
  };
}

export async function getAdminDashboard(userId: string) {
  const scope = await getAdminScope(userId);
  const offerWhere = {
    deletedAt: null,
    ...(scope.role === "regional_admin" ? { regionId: scope.regionId } : {})
  };
  const queryWhere = {
    deletedAt: null,
    ...(scope.role === "regional_admin" ? { regionId: scope.regionId } : {})
  };
  const studentWhere = {
    deletedAt: null,
    roles: { has: RoleCode.student },
    ...(scope.role === "regional_admin"
      ? { studentOffers: { some: { regionId: scope.regionId, deletedAt: null } } }
      : {})
  };
  const volunteerWhere = {
    deletedAt: null,
    roles: { has: RoleCode.mentor },
    volunteerProfile: {
      is: {
        deletedAt: null,
        ...(scope.role === "regional_admin" ? { preferredRegionId: scope.regionId } : {})
      }
    }
  };

  const [
    studentTotal,
    profileCounts,
    offerTotal,
    offerCounts,
    queryTotal,
    queryCounts,
    volunteerTotal,
    volunteerCounts,
    publishedAnnouncements,
    draftAnnouncements,
    recentOffers,
    recentQueries,
    recentAuditLogs
  ] = await Promise.all([
    prisma.user.count({ where: studentWhere }),
    prisma.studentProfile.groupBy({
      by: ["profileStatus"],
      where:
        scope.role === "regional_admin"
          ? { user: { studentOffers: { some: { regionId: scope.regionId, deletedAt: null } } } }
          : { deletedAt: null },
      orderBy: { profileStatus: "asc" },
      _count: { id: true }
    }),
    prisma.offer.count({ where: offerWhere }),
    prisma.offer.groupBy({
      by: ["reviewStatus"],
      where: offerWhere,
      orderBy: { reviewStatus: "asc" },
      _count: { id: true }
    }),
    prisma.query.count({ where: queryWhere }),
    prisma.query.groupBy({
      by: ["status"],
      where: queryWhere,
      orderBy: { status: "asc" },
      _count: { id: true }
    }),
    prisma.user.count({ where: volunteerWhere }),
    prisma.volunteerProfile.groupBy({
      by: ["volunteerStatus"],
      where:
        scope.role === "regional_admin"
          ? { deletedAt: null, preferredRegionId: scope.regionId }
          : { deletedAt: null },
      orderBy: { volunteerStatus: "asc" },
      _count: { id: true }
    }),
    prisma.announcement.count({ where: { deletedAt: null, isPublished: true } }),
    prisma.announcement.count({ where: { deletedAt: null, isPublished: false } }),
    prisma.offer.findMany({
      where: offerWhere,
      select: {
        id: true,
        universityName: true,
        courseName: true,
        reviewStatus: true,
        updatedAt: true,
        student: { select: { id: true, fullName: true, email: true } },
        region: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    prisma.query.findMany({
      where: queryWhere,
      select: {
        id: true,
        title: true,
        queryType: true,
        status: true,
        updatedAt: true,
        student: { select: { id: true, fullName: true, email: true } },
        region: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    scope.role === "master_admin"
      ? prisma.auditLog.findMany({
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            createdAt: true,
            actor: { select: { id: true, fullName: true, email: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        })
      : prisma.auditLog.findMany({ where: { id: "__never__" }, take: 0 })
  ]);

  return {
    scope,
    counts: {
      students: {
        total: studentTotal,
        byProfileStatus: countRows(
          profileCounts.map((row) => ({ key: row.profileStatus, count: groupCount(row._count) }))
        )
      },
      offers: {
        total: offerTotal,
        byReviewStatus: countRows(
          offerCounts.map((row) => ({ key: row.reviewStatus, count: groupCount(row._count) }))
        )
      },
      queries: {
        total: queryTotal,
        byStatus: countRows(queryCounts.map((row) => ({ key: row.status, count: groupCount(row._count) })))
      },
      volunteers: {
        total: volunteerTotal,
        byStatus: countRows(
          volunteerCounts.map((row) => ({ key: row.volunteerStatus, count: groupCount(row._count) }))
        )
      },
      announcements: {
        published: publishedAnnouncements,
        draft: draftAnnouncements
      }
    },
    recent: {
      offers: recentOffers,
      queries: recentQueries,
      auditLogs: recentAuditLogs
    }
  };
}

export async function getMentorDashboard(userId: string) {
  const [queryCounts, recentQueries, offerCounts, recentOffers] = await Promise.all([
    prisma.query.groupBy({
      by: ["status"],
      where: { assignedToUserId: userId, deletedAt: null },
      orderBy: { status: "asc" },
      _count: { id: true }
    }),
    prisma.query.findMany({
      where: { assignedToUserId: userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        queryType: true,
        status: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        region: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    prisma.offer.groupBy({
      by: ["reviewStatus"],
      where: { mentorId: userId, deletedAt: null },
      orderBy: { reviewStatus: "asc" },
      _count: { id: true }
    }),
    prisma.offer.findMany({
      where: { mentorId: userId, deletedAt: null },
      select: {
        id: true,
        universityName: true,
        courseName: true,
        reviewStatus: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        region: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    })
  ]);

  const byStatus = countRows(queryCounts.map((row) => ({ key: row.status, count: groupCount(row._count) })));
  const offersByStatus = countRows(
    offerCounts.map((row) => ({ key: row.reviewStatus, count: groupCount(row._count) }))
  );

  return {
    counts: {
      assignedQueries: {
        total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
        openOrAssigned: (byStatus[QueryStatus.open] ?? 0) + (byStatus[QueryStatus.assigned] ?? 0),
        byStatus
      },
      assignedOffers: {
        total: Object.values(offersByStatus).reduce((sum, count) => sum + count, 0),
        byStatus: offersByStatus
      }
    },
    recent: {
      assignedQueries: recentQueries,
      assignedOffers: recentOffers
    }
  };
}
