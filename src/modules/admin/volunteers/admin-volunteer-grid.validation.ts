import { RoleCode, VolunteerStatus } from "@prisma/client";
import { z } from "zod";

export const listAdminVolunteersQuerySchema = z.object({
  search: z.string().min(1).optional(),
  volunteerStatus: z.nativeEnum(VolunteerStatus).optional(),
  role: z.nativeEnum(RoleCode).optional(),
  preferredRegionId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25)
});

export type ListAdminVolunteersQuery = z.infer<typeof listAdminVolunteersQuerySchema>;
