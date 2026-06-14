import { BaseRepository } from "./base.repository";
import { DocumentModel, IDocumentDocument } from "../models/document.model";
import { DocumentStatus } from "../models/enums";

export class DocumentRepository extends BaseRepository<IDocumentDocument> {
  constructor() {
    super(DocumentModel);
  }

  async findActiveByOwner(ownerUserId: string): Promise<IDocumentDocument[]> {
    return this.find({ ownerUserId, status: DocumentStatus.active });
  }

  async supersedeDocuments(input: {
    ownerUserId: string;
    studentProfileId: string;
    offerId?: string | null;
    documentType: string;
  }): Promise<void> {
    await this.updateMany(
      {
        ownerUserId: input.ownerUserId,
        studentProfileId: input.studentProfileId,
        offerId: input.offerId || null,
        documentType: input.documentType,
        status: DocumentStatus.active
      },
      {
        status: DocumentStatus.superseded
      }
    );
  }
}

export const documentRepository = new DocumentRepository();
