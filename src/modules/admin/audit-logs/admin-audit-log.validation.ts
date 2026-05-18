import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  action: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  actorUserId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25)
}).refine((query) => !query.from || !query.to || query.from <= query.to, {
  message: "from must be before to",
  path: ["from"]
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
