import { Router } from "express";
import mongoose from "mongoose";
import { asyncHandler, sendSuccess } from "../../shared/http";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  sendSuccess(res, { status: "ok" });
});

healthRouter.get(
  "/db",
  asyncHandler(async (_req, res) => {
    if (mongoose.connection.readyState === 1) {
      sendSuccess(res, { status: "ok", database: "reachable" });
    } else {
      res.status(500).json({ status: "error", database: "unreachable" });
    }
  })
);
