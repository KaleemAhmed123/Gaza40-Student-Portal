import bcrypt from "bcryptjs";
import { prisma } from "../../../db/prisma";
import { ApiError } from "../../../shared/http";
import { RoleCode, AccountStatus } from "@prisma/client";
import type { CreateRegionalAdminInput } from "./admin-regional-admin.validation";

const passwordSaltRounds = 12;

export async function createRegionalAdmin(input: CreateRegionalAdminInput, creatorUserId: string) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new ApiError(400, "Email is already registered");
  }

  // Verify region exists
  const region = await prisma.region.findFirst({
    where: { id: input.regionId, isActive: true, deletedAt: null }
  });

  if (!region) {
    throw new ApiError(404, "Target region not found or inactive");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);

  // Create User and RegionalAdminProfile in transaction
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        accountStatus: AccountStatus.active,
        roles: [RoleCode.regional_admin]
      }
    });

    const profile = await tx.regionalAdminProfile.create({
      data: {
        userId: user.id,
        regionId: region.id,
        assignedByUserId: creatorUserId
      },
      include: {
        region: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      regionalAdminProfile: profile
    };
  });
}

export async function listRegionalAdmins() {
  const users = await prisma.user.findMany({
    where: {
      roles: { has: RoleCode.regional_admin },
      deletedAt: null
    },
    include: {
      regionalAdminProfile: {
        include: {
          region: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Format the output to be clean and useful for the client
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt,
    status: user.regionalAdminProfile?.status || "active",
    regionId: user.regionalAdminProfile?.regionId || null,
    region: user.regionalAdminProfile?.region ? {
      id: user.regionalAdminProfile.region.id,
      code: user.regionalAdminProfile.region.code,
      name: user.regionalAdminProfile.region.name
    } : null
  }));
}
