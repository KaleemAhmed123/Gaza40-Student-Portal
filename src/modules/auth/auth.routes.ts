import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  registerStudentHandler,
  registerVolunteerHandler
} from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register/student", registerStudentHandler);
authRouter.post("/register/volunteer", registerVolunteerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", requireAuth, meHandler);
