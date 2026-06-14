import { RoleCode } from "../../../db/models/enums";
import { Router } from "express";
import { requireAnyActiveDbRole, requireAuth } from "../../../middleware/auth.middleware";
import {
  getStudentProfileForAdminHandler,
  listStudentProfilesHandler,
  reviewStudentProfileHandler
} from "./admin-student-profile.controller";

export const adminStudentProfileRouter = Router();

adminStudentProfileRouter.use(
  requireAuth,
  requireAnyActiveDbRole([RoleCode.master_admin, RoleCode.regional_admin])
);
adminStudentProfileRouter.get("/", listStudentProfilesHandler);
adminStudentProfileRouter.get("/:id", getStudentProfileForAdminHandler);
adminStudentProfileRouter.patch("/:id/review", reviewStudentProfileHandler);
