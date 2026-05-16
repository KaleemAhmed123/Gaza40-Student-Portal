import { ProfileStatus } from "@prisma/client";
import { z } from "zod";

export const listStudentProfilesQuerySchema = z.object({
  status: z.nativeEnum(ProfileStatus).optional()
});

const allowedReviewStatuses = [
  ProfileStatus.approved,
  ProfileStatus.changes_requested,
  ProfileStatus.rejected
] as const;

export const reviewStudentProfileSchema = z.object({
  status: z.enum(allowedReviewStatuses),
  notes: z.string().min(1).optional()
});
