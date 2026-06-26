import bcrypt from "bcryptjs";
import { prisma } from "../../../db/prisma";
import { ApiError } from "../../../shared/http";
import { RoleCode, AccountStatus, RegionalAdminStatus, AuthTokenType } from "@prisma/client";
import { sendEmailBestEffort } from "../../../shared/email";
import { emailTemplates } from "../../../shared/email-templates";
import { io } from "../../chat/chat.socket";
import type { CreateRegionalAdminInput, UpdateRegionalAdminInput } from "./admin-regional-admin.validation";

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
        roles: [RoleCode.regional_admin],
        deletedAt: null
      }
    });

    const profile = await tx.regionalAdminProfile.create({
      data: {
        userId: user.id,
        regionId: region.id,
        assignedByUserId: creatorUserId,
        plainPassword: input.password,
        deletedAt: null
      },
      include: {
        region: true
      }
    });

    // Send the welcome email with credentials
    sendEmailBestEffort({
      to: [user.email],
      subject: "Welcome to Gaza40 - Regional Admin Account Created",
      text: `Hello ${user.fullName},\n\nYour Regional Admin account has been created.\nEmail: ${user.email}\nPassword: ${input.password}\nRegion: ${region.name}\n\nPlease log in and change your password.`,
      html: emailTemplates.regionalAdminInvite(user.fullName, user.email, input.password, region.name)
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

export async function resendRegionalAdminInvite(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, roles: { has: RoleCode.regional_admin }, deletedAt: null },
    include: {
      regionalAdminProfile: {
        include: { region: true }
      }
    }
  });

  if (!user || !user.regionalAdminProfile) {
    throw new ApiError(404, "Regional Admin not found");
  }

  const { regionalAdminProfile } = user;

  sendEmailBestEffort({
    to: [user.email],
    subject: "Welcome to Gaza40 - Regional Admin Account Credentials",
    text: `Hello ${user.fullName},\n\nYour Regional Admin account details.\nEmail: ${user.email}\nPassword: ${regionalAdminProfile.plainPassword || 'Contact Master Admin'}\nRegion: ${regionalAdminProfile.region.name}\n\nPlease log in and change your password.`,
    html: emailTemplates.regionalAdminInvite(
      user.fullName,
      user.email,
      regionalAdminProfile.plainPassword || undefined,
      regionalAdminProfile.region.name
    )
  });

  return { message: "Invitation email sent successfully" };
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
    } : null,
    plainPassword: user.regionalAdminProfile?.plainPassword || null
  }));
}

export async function updateRegionalAdmin(id: string, input: UpdateRegionalAdminInput) {
  const existingUser = await prisma.user.findFirst({
    where: { id, roles: { has: RoleCode.regional_admin }, deletedAt: null },
    include: { regionalAdminProfile: true }
  });

  if (!existingUser) {
    throw new ApiError(404, "Regional Admin not found");
  }

  if (input.email && input.email !== existingUser.email) {
    const emailConflict = await prisma.user.findUnique({
      where: { email: input.email }
    });
    if (emailConflict) {
      throw new ApiError(400, "Email is already registered");
    }
  }

  if (input.regionId) {
    const region = await prisma.region.findFirst({
      where: { id: input.regionId, isActive: true, deletedAt: null }
    });
    if (!region) {
      throw new ApiError(404, "Target region not found or inactive");
    }
  }

  let passwordHash: string | undefined;
  if (input.password) {
    passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);
  }

  let accountStatus: AccountStatus | undefined;
  let profileStatus: RegionalAdminStatus | undefined;
  if (input.status) {
    accountStatus = input.status === "active" ? AccountStatus.active : AccountStatus.disabled;
    profileStatus = input.status === "active" ? RegionalAdminStatus.active : RegionalAdminStatus.inactive;
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: {
        ...(input.fullName ? { fullName: input.fullName } : {}),
        ...(input.email ? { email: input.email } : {}),
        ...(passwordHash ? { passwordHash } : {}),
        ...(accountStatus ? { accountStatus } : {})
      }
    });

    const profile = await tx.regionalAdminProfile.update({
      where: { userId: id },
      data: {
        ...(input.regionId ? { regionId: input.regionId } : {}),
        ...(profileStatus ? { status: profileStatus } : {}),
        ...(input.password ? { plainPassword: input.password } : {})
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
      status: profile.status,
      regionId: profile.regionId,
      region: {
        id: profile.region.id,
        code: profile.region.code,
        name: profile.region.name
      },
      plainPassword: profile.plainPassword || null
    };
  });

  // Force-disconnect deactivated user from active socket sessions
  if (accountStatus === AccountStatus.disabled && io) {
    io.in(`user_${id}`).disconnectSockets(true);
  }

  return result;
}

export async function deleteRegionalAdmin(id: string) {
  const existingUser = await prisma.user.findFirst({
    where: { id, roles: { has: RoleCode.regional_admin }, deletedAt: null }
  });

  if (!existingUser) {
    throw new ApiError(404, "Regional Admin not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        accountStatus: AccountStatus.disabled
      }
    });

    await tx.regionalAdminProfile.update({
      where: { userId: id },
      data: {
        deletedAt: new Date(),
        status: RegionalAdminStatus.inactive
      }
    });
  });

  // Force-disconnect deleted user from active socket sessions
  if (io) {
    io.in(`user_${id}`).disconnectSockets(true);
  }

  return { success: true };
}

