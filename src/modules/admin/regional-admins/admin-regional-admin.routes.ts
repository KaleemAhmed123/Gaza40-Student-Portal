import { RoleCode } from "@prisma/client";
import { Router } from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.middleware";
import {
  createRegionalAdminHandler,
  listRegionalAdminsHandler
} from "./admin-regional-admin.controller";

export const adminRegionalAdminRouter = Router();

// Only master admins can list and create regional admins
adminRegionalAdminRouter.use(requireAuth, requireRole([RoleCode.master_admin]));

adminRegionalAdminRouter.get("/", listRegionalAdminsHandler);
adminRegionalAdminRouter.post("/", createRegionalAdminHandler);
