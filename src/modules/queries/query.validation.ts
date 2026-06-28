import { QueryStatus } from "@prisma/client";
import { z } from "zod";
import { objectIdSchema } from "../../shared/validation";

export const createQuerySchema = z.object({
  queryType: z.string().min(1),
  title: z.string().min(3).max(180),
  message: z.string().min(3).max(5000),
  regionId: objectIdSchema.optional(),
  offerId: objectIdSchema.optional()
});

export const addQueryMessageSchema = z.object({
  message: z.string().min(1).max(5000)
});

export const listQueriesQuerySchema = z.object({
  status: z.nativeEnum(QueryStatus).optional(),
  regionId: objectIdSchema.optional(),
  queryType: z.string().min(1).optional(),
  universityId: objectIdSchema.optional(),
  assignedToName: z.string().optional(),
  title: z.string().optional(),
  isEscalated: z.enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true"))
});

export const assignQuerySchema = z.object({
  assignedToUserId: objectIdSchema
});

export const escalateQuerySchema = z.object({
  remark: z.string().min(3).max(2000)
});

export type CreateQueryInput = z.infer<typeof createQuerySchema>;
export type AddQueryMessageInput = z.infer<typeof addQueryMessageSchema>;
export type ListQueriesQuery = z.infer<typeof listQueriesQuerySchema>;
export type AssignQueryInput = z.infer<typeof assignQuerySchema>;
export type EscalateQueryInput = z.infer<typeof escalateQuerySchema>;
