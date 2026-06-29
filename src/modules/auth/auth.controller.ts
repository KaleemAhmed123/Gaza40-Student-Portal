import type { Response } from "express";
import { env } from "../../config/env";
import { asyncHandler, sendSuccess, ApiError } from "../../shared/http";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./token";
import {
  forgotPasswordSchema,
  loginSchema,
  registerStudentSchema,
  registerVolunteerSchema,
  resetPasswordSchema,
  sendVerificationEmailSchema,
  verifyEmailSchema
} from "./auth.validation";
import {
  forgotPassword,
  getCurrentUser,
  login,
  registerStudent,
  registerVolunteer,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  updateMyVolunteerProfile
} from "./auth.service";

const accessCookieName = "accessToken";
const refreshCookieName = "refreshToken";

function accessCookieOptions() {
  const useSecureCookie = env.COOKIE_SECURE || env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: useSecureCookie,
    sameSite: useSecureCookie ? "none" as const : "lax" as const,
    path: "/",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  };
}

function refreshCookieOptions() {
  const useSecureCookie = env.COOKIE_SECURE || env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: useSecureCookie,
    sameSite: useSecureCookie ? "none" as const : "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
}

function setAccessCookie(res: Response, token: string) {
  res.cookie(accessCookieName, token, accessCookieOptions());
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(refreshCookieName, token, refreshCookieOptions());
}

function clearCookieOptions() {
  const useSecureCookie = env.COOKIE_SECURE || env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: useSecureCookie,
    sameSite: useSecureCookie ? "none" as const : "lax" as const,
    path: "/"
  };
}

export const registerStudentHandler = asyncHandler(async (req, res) => {
  const input = registerStudentSchema.parse(req.body);
  const authUser = await registerStudent(input);
  setAccessCookie(res, signAccessToken(authUser));
  setRefreshCookie(res, signRefreshToken(authUser));
  sendSuccess(res, { user: authUser }, 201);
});

export const registerVolunteerHandler = asyncHandler(async (req, res) => {
  const input = registerVolunteerSchema.parse(req.body);
  const authUser = await registerVolunteer(input);
  setAccessCookie(res, signAccessToken(authUser));
  setRefreshCookie(res, signRefreshToken(authUser));
  sendSuccess(res, { user: authUser }, 201);
});

export const loginHandler = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const authUser = await login(input);
  setAccessCookie(res, signAccessToken(authUser));
  setRefreshCookie(res, signRefreshToken(authUser));
  sendSuccess(res, { user: authUser });
});

export const logoutHandler = asyncHandler(async (_req, res) => {
  res.clearCookie(accessCookieName, clearCookieOptions());
  res.clearCookie(refreshCookieName, clearCookieOptions());
  sendSuccess(res, { loggedOut: true });
});

export const meHandler = asyncHandler(async (req, res) => {
  const authUser = await getCurrentUser(req.authUser!.id);
  sendSuccess(res, { user: authUser });
});

export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[refreshCookieName];
  if (!refreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  try {
    const authUser = verifyRefreshToken(refreshToken);
    const freshUser = await getCurrentUser(authUser.id);
    
    // Set a new access token
    setAccessCookie(res, signAccessToken(freshUser));
    
    sendSuccess(res, { tokenRefreshed: true });
  } catch (error) {
    res.clearCookie(accessCookieName, clearCookieOptions());
    res.clearCookie(refreshCookieName, clearCookieOptions());
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

export const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const input = forgotPasswordSchema.parse(req.body);
  const result = await forgotPassword(input);
  sendSuccess(res, result);
});

export const resetPasswordHandler = asyncHandler(async (req, res) => {
  const input = resetPasswordSchema.parse(req.body);
  const result = await resetPassword(input);
  sendSuccess(res, result);
});

export const sendVerificationEmailHandler = asyncHandler(async (req, res) => {
  const input = sendVerificationEmailSchema.parse(req.body);
  const result = await sendVerificationEmail(req.authUser!.id, input);
  sendSuccess(res, result);
});

export const verifyEmailHandler = asyncHandler(async (req, res) => {
  const input = verifyEmailSchema.parse(req.body);
  const result = await verifyEmail(input);
  sendSuccess(res, result);
});

export const updateMyVolunteerProfileHandler = asyncHandler(async (req, res) => {
  const { universityAffiliation } = req.body;
  if (!universityAffiliation) {
    throw new ApiError(400, "universityAffiliation is required");
  }

  const authUser = await updateMyVolunteerProfile(req.authUser!.id, universityAffiliation);
  setAccessCookie(res, signAccessToken(authUser));
  setRefreshCookie(res, signRefreshToken(authUser));
  sendSuccess(res, { user: authUser });
});
