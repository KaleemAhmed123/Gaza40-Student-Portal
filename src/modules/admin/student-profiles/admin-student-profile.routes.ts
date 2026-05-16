import { RoleCode } from "@prisma/client";
import { Router } from "express";
import { requireActiveDbRole, requireAuth } from "../../../middleware/auth.middleware";
import {
  getStudentProfileForAdminHandler,
  listStudentProfilesHandler,
  reviewStudentProfileHandler
} from "./admin-student-profile.controller";

export const adminStudentProfileRouter = Router();

adminStudentProfileRouter.use(requireAuth, requireActiveDbRole(RoleCode.master_admin));
adminStudentProfileRouter.get("/", listStudentProfilesHandler);
adminStudentProfileRouter.get("/:id", getStudentProfileForAdminHandler);
adminStudentProfileRouter.patch("/:id/review", reviewStudentProfileHandler);
