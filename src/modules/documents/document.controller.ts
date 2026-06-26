import fs from "fs/promises";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { uploadDocumentSchema } from "./document.validation";
import { getDownloadableDocument, saveDocument } from "./document.service";
import { verifyCsvDocToken } from "./csv-doc-token";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../shared/http";
import { getSignedStorageUrl } from "../../shared/storage";

export const uploadDocumentHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { message: "File is required" } });
    return;
  }

  try {
    const input = uploadDocumentSchema.parse(req.body);
    const document = await saveDocument({
      userId: req.authUser!.id,
      documentType: input.documentType,
      offerId: input.offerId,
      file: req.file
    });

    sendSuccess(
      res,
      {
        document: {
          id: document.id,
          documentType: document.documentType,
          originalFilename: document.originalFilename,
          mimeType: document.mimeType,
          fileSizeBytes: document.fileSizeBytes,
          createdAt: document.createdAt
        }
      },
      201
    );
  } catch (error) {
    throw error;
  }
});

export const downloadDocumentHandler = asyncHandler(async (req, res) => {
  const { document, absolutePath, url } = await getDownloadableDocument({
    documentId: req.params.id,
    requesterUserId: req.authUser!.id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    download: true
  });

  if (url) {
    res.redirect(url);
    return;
  }

  res.download(absolutePath!, document.originalFilename);
});

export const previewDocumentHandler = asyncHandler(async (req, res) => {
  const { document, absolutePath, url } = await getDownloadableDocument({
    documentId: req.params.id,
    requesterUserId: req.authUser!.id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });

  if (url) {
    res.redirect(url);
    return;
  }

  // Set headers for inline browser rendering
  res.setHeader("Content-Type", document.mimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(document.originalFilename)}"`
  );
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  const stream = await fs.readFile(absolutePath!);
  res.end(stream);
});

/**
 * GET /api/documents/:id/signed-download?token=<jwt>
 *
 * No platform login required. Validates a CSV doc JWT, then 302-redirects
 * to a fresh 1-hour R2 presigned URL so the browser downloads the file directly.
 * Used for offer letter URLs embedded inside generated CSVs.
 */
export const csvSignedDownloadHandler = asyncHandler(async (req, res) => {
  const docId = req.params.id;
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) {
    throw new ApiError(400, "Missing download token");
  }

  try {
    verifyCsvDocToken(token, docId);
  } catch {
    throw new ApiError(403, "Invalid or expired download token");
  }

  const doc = await prisma.document.findFirst({
    where: { id: docId, status: "active", deletedAt: null },
    select: { storageKey: true, storageBucket: true, originalFilename: true }
  });

  if (!doc) {
    throw new ApiError(404, "Document not found");
  }

  // Generate a fresh 1-hour R2 presigned URL — browser follows and downloads directly
  const presignedUrl = await getSignedStorageUrl(
    doc.storageKey,
    doc.storageBucket,
    3600,
    doc.originalFilename
  );

  if (!presignedUrl) {
    throw new ApiError(500, "Could not generate download URL");
  }

  res.redirect(302, presignedUrl);
});
