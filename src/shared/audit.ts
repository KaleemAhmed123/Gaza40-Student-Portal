import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

type AuditInput = {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export async function recordAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}
