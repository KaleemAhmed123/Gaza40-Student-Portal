import fs from "fs/promises";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { uploadDocumentSchema } from "./document.validation";
import { getDownloadableDocument, saveDocument } from "./document.service";

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
