import { RoleCode } from "@prisma/client";
import { Router } from "express";
import { requireActiveMentor, requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  getAdminDashboardHandler,
  getMentorDashboardHandler,
  getStudentDashboardHandler
} from "./dashboard.controller";

export const studentDashboardRouter = Router();
export const adminDashboardRouter = Router();
export const mentorDashboardRouter = Router();

studentDashboardRouter.get(
  "/",
  requireAuth,
  requireRole([RoleCode.student]),
  getStudentDashboardHandler
);

adminDashboardRouter.get(
  "/",
  requireAuth,
  requireRole([RoleCode.master_admin, RoleCode.regional_admin, RoleCode.reviewer]),
  getAdminDashboardHandler
);

mentorDashboardRouter.get(
  "/",
  requireAuth,
  requireActiveMentor,
  getMentorDashboardHandler
);
