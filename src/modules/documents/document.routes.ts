import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { downloadDocumentHandler, uploadDocumentHandler } from "./document.controller";
import { uploadSingleDocument } from "./upload.middleware";

export const documentRouter = Router();

documentRouter.post("/", requireAuth, uploadSingleDocument, uploadDocumentHandler);
documentRouter.get("/:id/download", requireAuth, downloadDocumentHandler);
