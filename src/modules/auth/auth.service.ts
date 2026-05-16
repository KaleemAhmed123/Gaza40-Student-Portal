import bcrypt from "bcryptjs";
import { RoleCode } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../shared/http";
import type {
  loginSchema,
  registerStudentSchema,
  registerVolunteerSchema
} from "./auth.validation";
import type { z } from "zod";

type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
type RegisterVolunteerInput = z.infer<typeof registerVolunteerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

const passwordSaltRounds = 12;

async function buildAuthUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.deletedAt || user.accountStatus === "disabled") {
    throw new ApiError(401, "Invalid user account");
  }

  return {
    id: user.id,
    email: user.email,
    roles: user.roles
  };
}

export async function registerStudent(input: RegisterStudentInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      roles: [RoleCode.student],
      studentProfile: {
        create: {
          hasOfferSelfReported: input.hasOfferSelfReported
        }
      }
    }
  });

  return buildAuthUser(user.id);
}

export async function registerVolunteer(input: RegisterVolunteerInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      roles: [RoleCode.mentor],
      volunteerProfile: {
        create: {
          universityAffiliation: input.universityAffiliation
        }
      }
    }
  });

  return buildAuthUser(user.id);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.deletedAt) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return buildAuthUser(user.id);
}

export async function getCurrentUser(userId: string) {
  return buildAuthUser(userId);
}
