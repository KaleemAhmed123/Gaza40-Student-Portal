import { QueryStatus } from "@prisma/client";
import { z } from "zod";

export const createQuerySchema = z.object({
  queryType: z.string().min(1),
  title: z.string().min(3).max(180),
  message: z.string().min(3).max(5000),
  regionId: z.string().uuid().optional(),
  offerId: z.string().uuid().optional()
});

export const addQueryMessageSchema = z.object({
  message: z.string().min(1).max(5000)
});

export const listQueriesQuerySchema = z.object({
  status: z.nativeEnum(QueryStatus).optional(),
  regionId: z.string().uuid().optional(),
  queryType: z.string().min(1).optional()
});

export const assignQuerySchema = z.object({
  assignedToUserId: z.string().uuid()
});

export type CreateQueryInput = z.infer<typeof createQuerySchema>;
export type AddQueryMessageInput = z.infer<typeof addQueryMessageSchema>;
export type ListQueriesQuery = z.infer<typeof listQueriesQuerySchema>;
export type AssignQueryInput = z.infer<typeof assignQuerySchema>;
