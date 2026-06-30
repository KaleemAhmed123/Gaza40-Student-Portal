import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

import {
  createCsvJobHandler,
  listCsvJobsHandler,
  getCsvJobHandler,
  getCsvJobDownloadUrlHandler,
  downloadCsvFileDirectHandler,
  deleteCsvJobHandler,
  retryCsvJobHandler,
} from "./csv-generator.controller";

export const csvGeneratorRouter = Router();

// All routes require authentication and at least master_admin or regional_admin role
csvGeneratorRouter.use(requireAuth, requireRole(["master_admin", "regional_admin"]));

csvGeneratorRouter.post("/",                          createCsvJobHandler);
csvGeneratorRouter.get("/",                           listCsvJobsHandler);
csvGeneratorRouter.get("/:jobId",                     getCsvJobHandler);
csvGeneratorRouter.get("/:jobId/download",            getCsvJobDownloadUrlHandler);
csvGeneratorRouter.get("/:jobId/download-file",       downloadCsvFileDirectHandler);
csvGeneratorRouter.delete("/:jobId",                  deleteCsvJobHandler);
csvGeneratorRouter.post("/:jobId/retry",              retryCsvJobHandler);
