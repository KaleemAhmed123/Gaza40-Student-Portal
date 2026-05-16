import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  getMyStudentProfileHandler,
  submitMyStudentProfileHandler,
  updateMyStudentProfileHandler
} from "./student-profile.controller";

export const studentProfileRouter = Router();

studentProfileRouter.use(requireAuth, requireRole(["student"]));
studentProfileRouter.get("/me", getMyStudentProfileHandler);
studentProfileRouter.patch("/me", updateMyStudentProfileHandler);
studentProfileRouter.post("/me/submit", submitMyStudentProfileHandler);
