import { Router } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler, sendSuccess } from "../../shared/http";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  sendSuccess(res, { status: "ok" });
});

healthRouter.get(
  "/db",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, { status: "ok", database: "reachable" });
  })
);
