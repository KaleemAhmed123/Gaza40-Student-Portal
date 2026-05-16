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
    await fs.unlink(req.file.path).catch(() => undefined);
    throw error;
  }
});

export const downloadDocumentHandler = asyncHandler(async (req, res) => {
  const { document, absolutePath } = await getDownloadableDocument({
    documentId: req.params.id,
    requesterUserId: req.authUser!.id
  });

  res.download(absolutePath, document.originalFilename);
});
