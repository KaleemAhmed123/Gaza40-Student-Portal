import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshTokenHandler,
  registerStudentHandler,
  registerVolunteerHandler,
  resetPasswordHandler,
  sendVerificationEmailHandler,
  verifyEmailHandler,
  updateMyVolunteerProfileHandler
} from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register/student", registerStudentHandler);
authRouter.post("/register/volunteer", registerVolunteerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/refresh", refreshTokenHandler);
authRouter.get("/me", requireAuth, meHandler);
authRouter.patch("/me/volunteer-profile", requireAuth, updateMyVolunteerProfileHandler);
authRouter.post("/forgot-password", forgotPasswordHandler);
authRouter.post("/reset-password", resetPasswordHandler);
authRouter.post("/send-verification-email", requireAuth, sendVerificationEmailHandler);
authRouter.post("/verify-email", verifyEmailHandler);
