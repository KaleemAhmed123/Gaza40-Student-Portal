import { RoleCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db/prisma";
import { ApiError } from "../../../shared/http";
import type { ListAdminVolunteersQuery } from "./admin-volunteer-grid.validation";

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
    throw new ApiError(403, "You do not have permission to access volunteers");
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

  throw new ApiError(403, "You do not have permission to access volunteers");
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
        volunteerProfile: {
          is: {
            universityAffiliation: { contains: search, mode: "insensitive" }
          }
        }
      }
    ]
  };
}

function buildBaseWhere(query: ListAdminVolunteersQuery): Prisma.UserWhereInput {
  return {
    deletedAt: null,
    roles: { has: query.role ?? RoleCode.mentor },
    ...buildSearchWhere(query.search),
    volunteerProfile: {
      is: {
        deletedAt: null,
        ...(query.volunteerStatus ? { volunteerStatus: query.volunteerStatus } : {}),
        ...(query.preferredRegionId ? { preferredRegionId: query.preferredRegionId } : {})
      }
    }
  };
}

export async function listAdminVolunteers(userId: string, query: ListAdminVolunteersQuery) {
  const scope = await getAdminScope(userId);
  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  const where = buildBaseWhere(query);

  if (scope.role === "regional_admin") {
    where.volunteerProfile = {
      is: {
        deletedAt: null,
        preferredRegionId: scope.regionId,
        ...(query.volunteerStatus ? { volunteerStatus: query.volunteerStatus } : {})
      }
    };
  }

  const [volunteers, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        roles: true,
        accountStatus: true,
        createdAt: true,
        volunteerProfile: {
          select: {
            id: true,
            universityAffiliation: true,
            preferredRegionId: true,
            volunteerStatus: true,
            reviewedBy: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true
          }
        },
        regionalAdminProfile: {
          select: {
            id: true,
            regionId: true,
            status: true,
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
    volunteers: volunteers.map((volunteer) => ({
      id: volunteer.id,
      fullName: volunteer.fullName,
      email: volunteer.email,
      phone: volunteer.phone,
      dateOfBirth: volunteer.dateOfBirth,
      roles: volunteer.roles,
      accountStatus: volunteer.accountStatus,
      createdAt: volunteer.createdAt,
      profile: volunteer.volunteerProfile,
      regionalAdminProfile: volunteer.regionalAdminProfile
    })),
    pagination: { page: query.page, pageSize: query.pageSize, total }
  };
}
