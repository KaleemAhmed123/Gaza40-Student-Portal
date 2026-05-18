import fs from "fs";
import path from "path";
import { DocumentStatus, DocumentType, RoleCode } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { recordAuditLog } from "../../shared/audit";
import { ApiError } from "../../shared/http";
import {
  localPrivateBucket,
  offerDocumentTypes,
  privateUploadRoot,
  profileDocumentTypes
} from "./document.constants";

export async function saveDocument(input: {
  userId: string;
  documentType: DocumentType;
  offerId?: string;
  file: Express.Multer.File;
}) {
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: input.userId }
  });

  if (!studentProfile || studentProfile.deletedAt) {
    throw new ApiError(404, "Student profile not found");
  }

  const storageKey = path.join(privateUploadRoot, input.file.filename).replace(/\\/g, "/");

  if (profileDocumentTypes.has(input.documentType) && input.offerId) {
    throw new ApiError(400, "Profile documents cannot be attached to offers");
  }

  if (offerDocumentTypes.has(input.documentType) && !input.offerId) {
    throw new ApiError(400, "offerId is required for offer documents");
  }

  let offer: { id: string } | null = null;
  if (input.offerId) {
    offer = await prisma.offer.findFirst({
      where: {
        id: input.offerId,
        studentUserId: input.userId,
        deletedAt: null
      },
      select: { id: true }
    });

    if (!offer) {
      throw new ApiError(404, "Offer not found");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.document.updateMany({
      where: {
        ownerUserId: input.userId,
        studentProfileId: studentProfile.id,
        offerId: offer?.id,
        documentType: input.documentType,
        status: DocumentStatus.active
      },
      data: {
        status: DocumentStatus.superseded
      }
    });

    const document = await tx.document.create({
      data: {
        ownerUserId: input.userId,
        studentProfileId: studentProfile.id,
        offerId: offer?.id,
        documentType: input.documentType,
        originalFilename: input.file.originalname,
        mimeType: input.file.mimetype,
        fileSizeBytes: input.file.size,
        storageBucket: localPrivateBucket,
        storageKey,
        uploadedBy: input.userId
      }
    });

    if (input.documentType === DocumentType.consent_form) {
      await tx.studentProfile.update({
        where: { id: studentProfile.id },
        data: { consentSigned: true }
      });
    }

    return document;
  });
}

export async function getDownloadableDocument(input: {
  documentId: string;
  requesterUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const document = await prisma.document.findFirst({
    where: {
      id: input.documentId,
      status: DocumentStatus.active,
      deletedAt: null
    }
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (document.ownerUserId !== input.requesterUserId) {
    const isMasterAdmin = await prisma.user.findFirst({
      where: {
        id: input.requesterUserId,
        deletedAt: null,
        accountStatus: "active",
        roles: { has: RoleCode.master_admin }
      }
    });

    if (!isMasterAdmin) {
      throw new ApiError(403, "You do not have permission to access this document");
    }
  }

  const absolutePath = path.join(process.cwd(), document.storageKey);
  if (!fs.existsSync(absolutePath)) {
    throw new ApiError(404, "Document file not found");
  }

  await recordAuditLog({
    actorUserId: input.requesterUserId,
    action: "document_downloaded",
    entityType: "document",
    entityId: document.id,
    metadata: {
      ownerUserId: document.ownerUserId,
      documentType: document.documentType,
      offerId: document.offerId,
      studentProfileId: document.studentProfileId
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return {
    document,
    absolutePath
  };
}
