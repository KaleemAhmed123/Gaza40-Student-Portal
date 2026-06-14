import { RoleCode } from "../../../db/models/enums";
import { Router } from "express";
import { requireActiveDbRole, requireAuth } from "../../../middleware/auth.middleware";
import { getAuditLogHandler, listAuditLogsHandler } from "./admin-audit-log.controller";

export const adminAuditLogRouter = Router();

adminAuditLogRouter.use(requireAuth, requireActiveDbRole(RoleCode.master_admin));
adminAuditLogRouter.get("/", listAuditLogsHandler);
adminAuditLogRouter.get("/:id", getAuditLogHandler);
