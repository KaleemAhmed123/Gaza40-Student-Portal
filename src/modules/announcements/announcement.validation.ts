import { z } from "zod";
import { objectIdSchema } from "../../shared/validation";

export const listAnnouncementsQuerySchema = z.object({
  category: z.string().min(1).optional()
});

export const listAdminAnnouncementsQuerySchema = z.object({
  category: z.string().min(1).optional(),
  isPublished: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true"))
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(180),
  body: z.string().min(3).max(500000),
  category: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
  regionId: objectIdSchema.nullable().optional()
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type ListAnnouncementsQuery = z.infer<typeof listAnnouncementsQuerySchema>;
export type ListAdminAnnouncementsQuery = z.infer<typeof listAdminAnnouncementsQuerySchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
