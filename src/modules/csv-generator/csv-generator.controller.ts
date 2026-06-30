import { asyncHandler, sendSuccess, ApiError } from "../../shared/http";
import { generateCsvBodySchema, listCsvJobsQuerySchema } from "./csv-generator.validation";
import {
  createCsvJob,
  listCsvJobs,
  getCsvJob,
  getCsvJobDownloadUrl,
  getCsvJobFile,
  deleteCsvJob,
  retryCsvJob,
} from "./csv-job.service";

export const createCsvJobHandler = asyncHandler(async (req, res) => {
  const body   = generateCsvBodySchema.parse(req.body);
  const result = await createCsvJob(req.authUser!.id, req.authUser!.roles, body, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  if (result.duplicate) {
    res.status(409).json({ data: { jobId: result.jobId, status: result.status, message: "Identical job already queued" } });
    return;
  }

  sendSuccess(res, { jobId: result.jobId, status: result.status }, 202);
});

export const listCsvJobsHandler = asyncHandler(async (req, res) => {
  const query  = listCsvJobsQuerySchema.parse(req.query);
  const result = await listCsvJobs(req.authUser!.id, req.authUser!.roles, query);
  sendSuccess(res, result);
});

export const getCsvJobHandler = asyncHandler(async (req, res) => {
  const job = await getCsvJob(req.authUser!.id, req.authUser!.roles, req.params.jobId);
  sendSuccess(res, job);
});

export const getCsvJobDownloadUrlHandler = asyncHandler(async (req, res) => {
  const result = await getCsvJobDownloadUrl(req.authUser!.id, req.authUser!.roles, req.params.jobId);
  sendSuccess(res, result);
});

export const deleteCsvJobHandler = asyncHandler(async (req, res) => {
  const result = await deleteCsvJob(req.authUser!.id, req.authUser!.roles, req.params.jobId);
  sendSuccess(res, result);
});

export const retryCsvJobHandler = asyncHandler(async (req, res) => {
  const result = await retryCsvJob(req.authUser!.id, req.authUser!.roles, req.params.jobId);
  sendSuccess(res, result, 202);
});

export const downloadCsvFileDirectHandler = asyncHandler(async (req, res) => {
  const result = await getCsvJobFile(req.authUser!.id, req.authUser!.roles, req.params.jobId);

  if (result.isLocal) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.download(result.filePath!, result.filename);
  } else {
    if (result.url) {
      res.redirect(302, result.url);
    } else {
      throw new ApiError(500, "Could not retrieve CSV file");
    }
  }
});
