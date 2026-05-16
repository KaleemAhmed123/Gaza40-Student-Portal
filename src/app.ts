import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { adminStudentProfileRouter } from "./modules/admin/student-profiles/admin-student-profile.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { adminConfigRouter, configRouter } from "./modules/config/config.routes";
import { documentRouter } from "./modules/documents/document.routes";
import { healthRouter } from "./modules/health/health.routes";
import { adminOfferRouter } from "./modules/offers/admin-offer.routes";
import { studentOfferRouter } from "./modules/offers/student-offer.routes";
import { studentProfileRouter } from "./modules/student-profile/student-profile.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/config", configRouter);
app.use("/api/documents", documentRouter);
app.use("/api/student/profile", studentProfileRouter);
app.use("/api/student/offers", studentOfferRouter);
app.use("/api/admin/student-profiles", adminStudentProfileRouter);
app.use("/api/admin/offers", adminOfferRouter);
app.use("/api/admin/config", adminConfigRouter);

app.use(notFoundHandler);
app.use(errorHandler);
