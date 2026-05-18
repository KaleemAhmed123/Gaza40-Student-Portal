import { GazaLocation, PassportStatus, ProfileStatus } from "@prisma/client";
import { z } from "zod";

export const listAdminStudentsQuerySchema = z.object({
  search: z.string().min(1).optional(),
  profileStatus: z.nativeEnum(ProfileStatus).optional(),
  passportStatus: z.nativeEnum(PassportStatus).optional(),
  locationInGaza: z.nativeEnum(GazaLocation).optional(),
  hasVerifiedOffer: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  consentSigned: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25)
});

export type ListAdminStudentsQuery = z.infer<typeof listAdminStudentsQuerySchema>;
