import { asyncHandler, sendSuccess } from "../../../shared/http";
import { getAuditLog, listAuditLogs } from "./admin-audit-log.service";
import { listAuditLogsQuerySchema } from "./admin-audit-log.validation";

export const listAuditLogsHandler = asyncHandler(async (req, res) => {
  const query = listAuditLogsQuerySchema.parse(req.query);
  const result = await listAuditLogs(query);
  sendSuccess(res, result);
});

export const getAuditLogHandler = asyncHandler(async (req, res) => {
  const log = await getAuditLog(req.params.id);
  sendSuccess(res, { log });
});
