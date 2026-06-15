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
  queryType: z.string().min(1).optional()
});

export const assignQuerySchema = z.object({
  assignedToUserId: objectIdSchema
});

export type CreateQueryInput = z.infer<typeof createQuerySchema>;
export type AddQueryMessageInput = z.infer<typeof addQueryMessageSchema>;
export type ListQueriesQuery = z.infer<typeof listQueriesQuerySchema>;
export type AssignQueryInput = z.infer<typeof assignQuerySchema>;
