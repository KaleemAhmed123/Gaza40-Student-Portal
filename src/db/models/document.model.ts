import mongoose, { Schema, Document } from "mongoose";
import { DocumentType, DocumentStatus } from "./enums";

export interface IDocument {
  id: string;
  ownerUserId: string;
  studentProfileId?: string | null;
  offerId?: string | null;
  documentType: DocumentType;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  storageBucket: string;
  storageKey: string;
  status: DocumentStatus;
  uploadedBy: string;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface IDocumentDocument extends Omit<IDocument, "id" | "ownerUserId" | "studentProfileId" | "offerId" | "uploadedBy">, mongoose.Document {
  id: string;
  ownerUserId: mongoose.Types.ObjectId;
  studentProfileId?: mongoose.Types.ObjectId | null;
  offerId?: mongoose.Types.ObjectId | null;
  uploadedBy: mongoose.Types.ObjectId;
}

const DocumentSchema = new Schema<IDocumentDocument>(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      default: null,
      index: true
    },
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      default: null,
      index: true
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
      index: true
    },
    originalFilename: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileSizeBytes: {
      type: Number,
      required: true
    },
    storageBucket: {
      type: String,
      required: true
    },
    storageKey: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.active,
      index: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.ownerUserId = ret.ownerUserId ? ret.ownerUserId.toString() : null;
        ret.studentProfileId = ret.studentProfileId ? ret.studentProfileId.toString() : null;
        ret.offerId = ret.offerId ? ret.offerId.toString() : null;
        ret.uploadedBy = ret.uploadedBy ? ret.uploadedBy.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.ownerUserId = ret.ownerUserId ? ret.ownerUserId.toString() : null;
        ret.studentProfileId = ret.studentProfileId ? ret.studentProfileId.toString() : null;
        ret.offerId = ret.offerId ? ret.offerId.toString() : null;
        ret.uploadedBy = ret.uploadedBy ? ret.uploadedBy.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const DocumentModel = mongoose.models.Document || mongoose.model<IDocumentDocument>("Document", DocumentSchema);
