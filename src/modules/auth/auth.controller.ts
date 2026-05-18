import type { Response } from "express";
import { env } from "../../config/env";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { signAccessToken } from "./token";
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
  verifyEmail
} from "./auth.service";

const accessCookieName = "accessToken";

function setAccessCookie(res: Response, token: string) {
  res.cookie(accessCookieName, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/"
  });
}

export const registerStudentHandler = asyncHandler(async (req, res) => {
  const input = registerStudentSchema.parse(req.body);
  const authUser = await registerStudent(input);
  setAccessCookie(res, signAccessToken(authUser));
  sendSuccess(res, { user: authUser }, 201);
});

export const registerVolunteerHandler = asyncHandler(async (req, res) => {
  const input = registerVolunteerSchema.parse(req.body);
  const authUser = await registerVolunteer(input);
  setAccessCookie(res, signAccessToken(authUser));
  sendSuccess(res, { user: authUser }, 201);
});

export const loginHandler = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const authUser = await login(input);
  setAccessCookie(res, signAccessToken(authUser));
  sendSuccess(res, { user: authUser });
});

export const logoutHandler = asyncHandler(async (_req, res) => {
  res.clearCookie(accessCookieName, { path: "/" });
  sendSuccess(res, { loggedOut: true });
});

export const meHandler = asyncHandler(async (req, res) => {
  const authUser = await getCurrentUser(req.authUser!.id);
  sendSuccess(res, { user: authUser });
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
