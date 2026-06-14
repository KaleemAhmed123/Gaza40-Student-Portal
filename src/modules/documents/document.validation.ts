import { DocumentType } from "../../db/models/enums";
import { z } from "zod";
import { allowedDocumentTypes } from "./document.constants";

export const uploadDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType).refine(
    (documentType) => allowedDocumentTypes.includes(documentType),
    "Unsupported document type"
  ),
  offerId: z.string().uuid().optional()
});
