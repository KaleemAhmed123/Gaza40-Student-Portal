import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { getMentorStudentDetailsHandler } from "./mentor-student.controller";

export const mentorStudentRouter = Router();

mentorStudentRouter.use(requireAuth);

// GET /api/mentor/students/:id - Get student details assigned to this mentor (RBAC filtered)
mentorStudentRouter.get("/:id", getMentorStudentDetailsHandler);
