import { RoleCode } from "@prisma/client";
import { Router } from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.middleware";
import {
  exportAdminVolunteersHandler,
  listAdminVolunteersHandler,
  updateVolunteerAssignmentHandler
} from "./admin-volunteer-grid.controller";
import { getAdminVolunteerProfileHandler } from "./admin-volunteer-profile.controller";

export const adminVolunteerGridRouter = Router();

adminVolunteerGridRouter.use(requireAuth, requireRole([RoleCode.master_admin, RoleCode.regional_admin]));
adminVolunteerGridRouter.get("/export", exportAdminVolunteersHandler);
adminVolunteerGridRouter.get("/", listAdminVolunteersHandler);
adminVolunteerGridRouter.get("/:id", getAdminVolunteerProfileHandler);
adminVolunteerGridRouter.patch("/:id/assignment", updateVolunteerAssignmentHandler);
