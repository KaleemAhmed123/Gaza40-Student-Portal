import { RoleCode } from "@prisma/client";
import { Router } from "express";
import { requireAuth, requireRole } from "../../../middleware/auth.middleware";
import { listAdminStudentsHandler } from "./admin-student-grid.controller";

export const adminStudentGridRouter = Router();

adminStudentGridRouter.use(requireAuth, requireRole([RoleCode.master_admin, RoleCode.regional_admin]));
adminStudentGridRouter.get("/", listAdminStudentsHandler);
