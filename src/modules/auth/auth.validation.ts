import { z } from "zod";

export const registerStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  hasOfferSelfReported: z.boolean().default(false)
});

export const registerVolunteerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  preferredRegionId: z.string().uuid("Invalid region ID").optional(),
  universityAffiliation: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8)
});

export const sendVerificationEmailSchema = z.object({
  redirectPath: z.string().startsWith("/").optional()
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32)
});
