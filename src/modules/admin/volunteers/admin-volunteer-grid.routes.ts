import { RoleCode } from "@prisma/client";
import { Router } from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.middleware";
import { listAdminVolunteersHandler } from "./admin-volunteer-grid.controller";

export const adminVolunteerGridRouter = Router();

adminVolunteerGridRouter.use(requireAuth, requireRole([RoleCode.master_admin, RoleCode.regional_admin]));
adminVolunteerGridRouter.get("/", listAdminVolunteersHandler);
