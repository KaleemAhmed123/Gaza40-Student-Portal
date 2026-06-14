import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthTokenType, RoleCode, AccountStatus } from "../../db/models/enums";
import { env } from "../../config/env";
import {
  userRepository,
  authTokenRepository,
  studentProfileRepository,
  volunteerProfileRepository,
  regionalAdminProfileRepository,
  regionRepository
} from "../../db/repositories";
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

  await authTokenRepository.invalidatePreviousTokens(input.userId, input.type);
  await authTokenRepository.create({
    userId: input.userId,
    type: input.type,
    tokenHash,
    expiresAt: new Date(Date.now() + input.expiresInMs)
  });

  return token;
}

async function consumeAuthToken(input: { token: string; type: AuthTokenType }) {
  const authToken = await authTokenRepository.findOne(
    {
      tokenHash: hashToken(input.token),
      type: input.type,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    },
    "userId"
  );

  const user = authToken?.userId && typeof authToken.userId === "object" ? authToken.userId as any : null;

  if (!authToken || !user || user.deletedAt || user.accountStatus === "disabled") {
    throw new ApiError(400, "Invalid or expired token");
  }

  // Preserve compatibility for callers accessing authToken.user
  (authToken as any).user = user;

  return authToken;
}

function assertValidAuthUser(user: any) {
  if (!user || user.deletedAt || user.accountStatus === "disabled") {
    throw new ApiError(401, "Invalid user account");
  }

  return user;
}

async function toAuthUser(user: any) {
  const validUser = assertValidAuthUser(user);
  
  const [studentProfile, volunteerProfile, regionalAdminProfile] = await Promise.all([
    validUser.roles.includes(RoleCode.student)
      ? studentProfileRepository.findOne({ userId: validUser.id })
      : Promise.resolve(null),
    validUser.roles.includes(RoleCode.mentor)
      ? volunteerProfileRepository.findOne({ userId: validUser.id })
      : Promise.resolve(null),
    validUser.roles.includes(RoleCode.regional_admin)
      ? regionalAdminProfileRepository.findOne({ userId: validUser.id }, "regionId")
      : Promise.resolve(null)
  ]);

  let volunteerProfileWithRegion = null;
  if (volunteerProfile) {
    let region = null;
    if (volunteerProfile.preferredRegionId) {
      region = await regionRepository.findById(volunteerProfile.preferredRegionId.toString());
    }
    volunteerProfileWithRegion = {
      id: volunteerProfile.id,
      volunteerStatus: volunteerProfile.volunteerStatus,
      universityAffiliation: volunteerProfile.universityAffiliation,
      preferredRegionId: volunteerProfile.preferredRegionId,
      preferredRegion: region
        ? { id: region.id, code: region.code, name: region.name }
        : null
    };
  }

  let regionalAdminProfileResponse = null;
  if (regionalAdminProfile) {
    const region = regionalAdminProfile.regionId && typeof regionalAdminProfile.regionId === "object"
      ? regionalAdminProfile.regionId as any
      : null;

    regionalAdminProfileResponse = {
      id: regionalAdminProfile.id,
      regionId: region ? region.id : regionalAdminProfile.regionId,
      status: regionalAdminProfile.status,
      region: region
        ? { code: region.code, name: region.name }
        : null
    };
  }

  return {
    id: validUser.id,
    email: validUser.email,
    fullName: validUser.fullName,
    phone: validUser.phone,
    roles: validUser.roles,
    accountStatus: validUser.accountStatus,
    emailVerifiedAt: validUser.emailVerifiedAt,
    studentProfile: studentProfile
      ? {
          id: studentProfile.id,
          profileStatus: studentProfile.profileStatus,
          hasOfferSelfReported: studentProfile.hasOfferSelfReported,
          hasVerifiedOffer: studentProfile.hasVerifiedOffer
        }
      : null,
    volunteerProfile: volunteerProfileWithRegion,
    regionalAdminProfile: regionalAdminProfileResponse
  };
}

async function buildAuthUser(userId: string) {
  const user = await userRepository.findById(userId);
  return toAuthUser(user);
}

export async function registerStudent(input: RegisterStudentInput) {
  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);

  const user = await userRepository.create({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
    roles: [RoleCode.student]
  });

  await studentProfileRepository.create({
    userId: user._id,
    hasOfferSelfReported: input.hasOfferSelfReported
  });

  return buildAuthUser(user.id);
}

export async function registerVolunteer(input: RegisterVolunteerInput) {
  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);

  const user = await userRepository.create({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    phone: input.phone,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
    roles: [RoleCode.mentor]
  });

  await volunteerProfileRepository.create({
    userId: user._id,
    universityAffiliation: input.universityAffiliation,
    preferredRegionId: input.preferredRegionId || null
  });

  return buildAuthUser(user.id);
}

export async function login(input: LoginInput) {
  const user = await userRepository.findOne({ email: input.email.toLowerCase() });
  if (!user || user.deletedAt) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  void userRepository
    .update(user.id, { lastLoginAt: new Date() })
    .catch((error) => {
      console.error(
        `Failed to update last login timestamp: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    });

  return toAuthUser(user);
}

export async function getCurrentUser(userId: string) {
  return buildAuthUser(userId);
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await userRepository.findOne({
    email: input.email.toLowerCase(),
    accountStatus: AccountStatus.active
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

  await userRepository.update(authToken.userId.toString(), { passwordHash });
  await authTokenRepository.update(authToken.id, { usedAt: new Date() });

  await recordAuditLog({
    actorUserId: authToken.userId.toString(),
    action: "password_reset_completed",
    entityType: "user",
    entityId: authToken.userId.toString()
  });

  return { reset: true };
}

export async function sendVerificationEmail(
  userId: string,
  input: SendVerificationEmailInput
) {
  const user = await userRepository.findOne({
    _id: userId,
    accountStatus: AccountStatus.active
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

  await userRepository.update(authToken.userId.toString(), { emailVerifiedAt: new Date() });
  await authTokenRepository.update(authToken.id, { usedAt: new Date() });

  await recordAuditLog({
    actorUserId: authToken.userId.toString(),
    action: "email_verified",
    entityType: "user",
    entityId: authToken.userId.toString()
  });

  return { verified: true };
}
