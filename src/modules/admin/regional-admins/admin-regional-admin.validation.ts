import { z } from "zod";
import { objectIdSchema } from "../../../shared/validation";

export const createRegionalAdminSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  regionId: objectIdSchema
});

export type CreateRegionalAdminInput = z.infer<typeof createRegionalAdminSchema>;

export const updateRegionalAdminSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  regionId: objectIdSchema.optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export type UpdateRegionalAdminInput = z.infer<typeof updateRegionalAdminSchema>;
