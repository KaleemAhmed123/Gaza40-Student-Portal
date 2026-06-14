import fs from "fs";
import path from "path";
import { DocumentStatus, DocumentType, RoleCode, RegionalAdminStatus, AccountStatus } from "../../db/models/enums";
import {
  studentProfileRepository,
  documentRepository,
  offerRepository,
  userRepository,
  regionalAdminProfileRepository
} from "../../db/repositories";
import { recordAuditLog } from "../../shared/audit";
import { ApiError } from "../../shared/http";
import {
  imageOnlyDocumentTypes,
  localPrivateBucket,
  mentorVisibleDocumentTypes,
  offerDocumentTypes,
  privateUploadRoot,
  profileDocumentTypes,
  signatureMaxUploadSizeBytes
} from "./document.constants";

export async function saveDocument(input: {
  userId: string;
  documentType: DocumentType;
  offerId?: string;
  file: Express.Multer.File;
}) {
  const studentProfile = await studentProfileRepository.findByUserId(input.userId);

  if (!studentProfile || studentProfile.deletedAt) {
    throw new ApiError(404, "Student profile not found");
  }

  const storageKey = path.join(privateUploadRoot, input.file.filename).replace(/\\/g, "/");

  // Enforce 1MB limit for signature documents
  if (imageOnlyDocumentTypes.has(input.documentType) && input.file.size > signatureMaxUploadSizeBytes) {
    throw new ApiError(400, "Signature image must be under 1MB");
  }

  if (profileDocumentTypes.has(input.documentType) && input.offerId) {
    throw new ApiError(400, "Profile documents cannot be attached to offers");
  }

  if (offerDocumentTypes.has(input.documentType) && !input.offerId) {
    throw new ApiError(400, "offerId is required for offer documents");
  }

  let offer: any = null;
  if (input.offerId) {
    offer = await offerRepository.findOne({
      _id: input.offerId,
      studentUserId: input.userId,
      deletedAt: null
    });

    if (!offer) {
      throw new ApiError(404, "Offer not found");
    }
  }

  // Supersede existing documents of the same type/scope
  await documentRepository.supersedeDocuments({
    ownerUserId: input.userId,
    studentProfileId: studentProfile.id,
    offerId: offer?.id || null,
    documentType: input.documentType
  });

  // Create the new document
  const document = await documentRepository.create({
    ownerUserId: input.userId,
    studentProfileId: studentProfile.id,
    offerId: offer?.id || null,
    documentType: input.documentType,
    originalFilename: input.file.originalname,
    mimeType: input.file.mimetype,
    fileSizeBytes: input.file.size,
    storageBucket: localPrivateBucket,
    storageKey,
    uploadedBy: input.userId
  });

  if (input.documentType === DocumentType.consent_form) {
    await studentProfileRepository.update(studentProfile.id, { consentSigned: true });
  }

  return document;
}

export async function getDownloadableDocument(input: {
  documentId: string;
  requesterUserId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const document = await documentRepository.findOne({
    _id: input.documentId,
    status: DocumentStatus.active,
    deletedAt: null
  });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  let hasAccess = document.ownerUserId.toString() === input.requesterUserId;

  if (!hasAccess) {
    const user = await userRepository.findOne({
      _id: input.requesterUserId,
      deletedAt: null,
      accountStatus: AccountStatus.active
    });

    if (user) {
      if (user.roles.includes(RoleCode.master_admin)) {
        hasAccess = true;
      } else if (user.roles.includes(RoleCode.regional_admin)) {
        const rap = await regionalAdminProfileRepository.findOne({
          userId: input.requesterUserId,
          status: RegionalAdminStatus.active,
          deletedAt: null
        });

        if (rap) {
          const regionId = rap.regionId.toString();
          if (document.offerId) {
            const offer = await offerRepository.findOne({
              _id: document.offerId.toString(),
              regionId,
              deletedAt: null
            });
            if (offer) hasAccess = true;
          } else {
            if (profileDocumentTypes.has(document.documentType)) {
              hasAccess = true;
            } else {
              const hasOfferInRegion = await offerRepository.findOne({
                studentUserId: document.ownerUserId.toString(),
                regionId,
                deletedAt: null
              });
              if (hasOfferInRegion) hasAccess = true;
            }
          }
        }
      } else if (user.roles.includes(RoleCode.mentor)) {
        // Mentors cannot access passport or national_id documents
        if (!mentorVisibleDocumentTypes.has(document.documentType)) {
          // Do not grant access — fall through to hasAccess = false
        } else if (document.offerId) {
          const offer = await offerRepository.findOne({
            _id: document.offerId.toString(),
            mentorId: input.requesterUserId,
            deletedAt: null
          });
          if (offer) hasAccess = true;
        } else {
          const hasAssignedOffer = await offerRepository.findOne({
            studentUserId: document.ownerUserId.toString(),
            mentorId: input.requesterUserId,
            deletedAt: null
          });
          if (hasAssignedOffer) hasAccess = true;
        }
      }
    }
  }

  if (!hasAccess) {
    throw new ApiError(403, "You do not have permission to access this document");
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
      ownerUserId: document.ownerUserId.toString(),
      documentType: document.documentType,
      offerId: document.offerId ? document.offerId.toString() : null,
      studentProfileId: document.studentProfileId ? document.studentProfileId.toString() : null
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });

  return {
    document,
    absolutePath
  };
}
