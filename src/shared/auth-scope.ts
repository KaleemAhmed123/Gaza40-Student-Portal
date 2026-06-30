import { RoleCode, RegionalAdminStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { ApiError } from "./http";

export type AdminScope =
  | { role: "master_admin"; regionId?: never }
  | { role: "regional_admin"; regionId: string }
  | { role: "reviewer"; regionId?: never };

export async function getAdminScope(userId: string): Promise<AdminScope> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      accountStatus: "active"
    },
    include: { regionalAdminProfile: true }
  });

  if (!user) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }

  if (user.roles.includes(RoleCode.master_admin)) {
    return { role: "master_admin" };
  }

  if (user.roles.includes(RoleCode.reviewer)) {
    return { role: "reviewer" };
  }

  if (
    user.roles.includes(RoleCode.regional_admin) &&
    user.regionalAdminProfile?.status === RegionalAdminStatus.active &&
    !user.regionalAdminProfile.deletedAt
  ) {
    return { role: "regional_admin", regionId: user.regionalAdminProfile.regionId };
  }

  throw new ApiError(403, "You do not have permission to perform this action");
}
