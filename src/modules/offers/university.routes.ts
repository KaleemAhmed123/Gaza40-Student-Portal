import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { searchUniversities } from "./university.service";

export const universityRouter = Router();

universityRouter.get(
  "/search",
  requireAuth,
  asyncHandler(async (req, res) => {
    const query = String(req.query.q ?? "");
    const regionId = req.query.regionId ? String(req.query.regionId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const universities = await searchUniversities({ query, regionId, limit });
    sendSuccess(res, { universities });
  })
);
