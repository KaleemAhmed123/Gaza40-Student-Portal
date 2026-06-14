import { auditLogRepository } from "../db/repositories";

type AuditInput = {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
};

export async function recordAuditLog(input: AuditInput) {
  await auditLogRepository.create({
    actorUserId: input.actorUserId || null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || null,
    metadata: input.metadata || null,
    ipAddress: input.ipAddress || null,
    userAgent: input.userAgent || null
  });
}
