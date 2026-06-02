import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db/prisma";
import { ApiError } from "../../../shared/http";
import type { ListAuditLogsQuery } from "./admin-audit-log.validation";

function buildWhere(query: ListAuditLogsQuery): Prisma.AuditLogWhereInput {
  return {
    ...(query.action ? { action: query.action } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {})
          }
        }
      : {})
  };
}

const auditLogInclude = {
  actor: {
    select: {
      id: true,
      fullName: true,
      email: true,
      roles: true
    }
  }
};

export async function listAuditLogs(query: ListAuditLogsQuery) {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: auditLogInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total
    }
  };
}

export async function getAuditLog(id: string) {
  const log = await prisma.auditLog.findUnique({
    where: { id },
    include: auditLogInclude
  });

  if (!log) {
    throw new ApiError(404, "Audit log not found");
  }

  return log;
}
