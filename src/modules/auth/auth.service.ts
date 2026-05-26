import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthTokenType, RoleCode } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../db/prisma";
import { recordAuditLog } from "../../shared/audit";
import { sendEmailBestEffort } from "../../shared/email";
import { ApiError } from "../../shared/http";
import type {
  forgotPasswordSchema,
  loginSchema,
  registerStudentSchema,
  registerVolunteerSchema,
  resetPasswordSchema,
  sendVerificationEmailSchema,
  verifyEmailSchema
} from "./auth.validation";
import type { z } from "zod";

type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
type RegisterVolunteerInput = z.infer<typeof registerVolunteerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
type SendVerificationEmailInput = z.infer<typeof sendVerificationEmailSchema>;
type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

const passwordSaltRounds = 12;
const passwordResetExpiryMs = 60 * 60 * 1000;
const emailVerificationExpiryMs = 24 * 60 * 60 * 1000;

function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildFrontendUrl(path: string, token: string) {
  const url = new URL(path, env.FRONTEND_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

async function createAuthToken(input: {
  userId: string;
  type: AuthTokenType;
  expiresInMs: number;
}) {
  const token = createRawToken();
  const tokenHash = hashToken(token);

  await prisma.$transaction([
    prisma.authToken.updateMany({
      where: {
        userId: input.userId,
        type: input.type,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: { usedAt: new Date() }
    }),
    prisma.authToken.create({
      data: {
        userId: input.userId,
        type: input.type,
        tokenHash,
        expiresAt: new Date(Date.now() + input.expiresInMs)
      }
    })
  ]);

  return token;
}

async function consumeAuthToken(input: { token: string; type: AuthTokenType }) {
  const authToken = await prisma.authToken.findFirst({
    where: {
      tokenHash: hashToken(input.token),
      type: input.type,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!authToken || authToken.user.deletedAt || authToken.user.accountStatus === "disabled") {
    throw new ApiError(400, "Invalid or expired token");
  }

  return authToken;
}

async function buildAuthUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      roles: true,
      accountStatus: true,
      emailVerifiedAt: true,
      studentProfile: {
        select: {
          id: true,
          profileStatus: true,
          hasOfferSelfReported: true,
          hasVerifiedOffer: true
        }
      },
      volunteerProfile: {
        select: {
          id: true,
          volunteerStatus: true,
          universityAffiliation: true,
          preferredRegionId: true
        }
      },
      regionalAdminProfile: {
        select: {
          id: true,
          regionId: true,
          status: true,
          region: {
            select: {
              code: true,
              name: true
            }
          }
        }
      },
      deletedAt: true
    }
  });

  if (!user || user.deletedAt || user.accountStatus === "disabled") {
    throw new ApiError(401, "Invalid user account");
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    roles: user.roles,
    accountStatus: user.accountStatus,
    emailVerifiedAt: user.emailVerifiedAt,
    studentProfile: user.studentProfile,
    volunteerProfile: user.volunteerProfile,
    regionalAdminProfile: user.regionalAdminProfile
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

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null, accountStatus: "active" },
    select: { id: true, email: true, fullName: true }
  });

  if (!user) {
    return { message: "If the email exists, a reset link has been sent." };
  }

  const token = await createAuthToken({
    userId: user.id,
    type: AuthTokenType.password_reset,
    expiresInMs: passwordResetExpiryMs
  });

  sendEmailBestEffort({
    to: [user.email],
    subject: "Reset your Gaza40+ password",
    text: `Hi ${user.fullName},\n\nUse this link to reset your password:\n${buildFrontendUrl("/reset-password", token)}\n\nThis link expires in 1 hour.`
  });

  return { message: "If the email exists, a reset link has been sent." };
}

export async function resetPassword(input: ResetPasswordInput) {
  const authToken = await consumeAuthToken({
    token: input.token,
    type: AuthTokenType.password_reset
  });
  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: authToken.userId },
      data: { passwordHash }
    }),
    prisma.authToken.update({
      where: { id: authToken.id },
      data: { usedAt: new Date() }
    })
  ]);

  await recordAuditLog({
    actorUserId: authToken.userId,
    action: "password_reset_completed",
    entityType: "user",
    entityId: authToken.userId
  });

  return { reset: true };
}

export async function sendVerificationEmail(
  userId: string,
  input: SendVerificationEmailInput
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, accountStatus: "active" },
    select: { id: true, email: true, fullName: true, emailVerifiedAt: true }
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.emailVerifiedAt) {
    return { alreadyVerified: true };
  }

  const token = await createAuthToken({
    userId: user.id,
    type: AuthTokenType.email_verification,
    expiresInMs: emailVerificationExpiryMs
  });
  const redirectPath = input.redirectPath ?? "/verify-email";

  sendEmailBestEffort({
    to: [user.email],
    subject: "Verify your Gaza40+ email",
    text: `Hi ${user.fullName},\n\nUse this link to verify your email:\n${buildFrontendUrl(redirectPath, token)}\n\nThis link expires in 24 hours.`
  });

  return { sent: true };
}

export async function verifyEmail(input: VerifyEmailInput) {
  const authToken = await consumeAuthToken({
    token: input.token,
    type: AuthTokenType.email_verification
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: authToken.userId },
      data: { emailVerifiedAt: new Date() }
    }),
    prisma.authToken.update({
      where: { id: authToken.id },
      data: { usedAt: new Date() }
    })
  ]);

  await recordAuditLog({
    actorUserId: authToken.userId,
    action: "email_verified",
    entityType: "user",
    entityId: authToken.userId
  });

  return { verified: true };
}
