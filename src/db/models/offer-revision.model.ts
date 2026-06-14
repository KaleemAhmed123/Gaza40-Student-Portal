import mongoose, { Schema, Document } from "mongoose";

export interface IOfferRevision {
  id: string;
  offerId: string;
  editedBy: string;
  beforeData: any;
  afterData: any;
  changedFields: string[];
  createdAt: Date;
}

export interface IOfferRevisionDocument extends Omit<IOfferRevision, "id" | "offerId" | "editedBy">, Document {
  offerId: mongoose.Types.ObjectId;
  editedBy: mongoose.Types.ObjectId;
}

const OfferRevisionSchema = new Schema<IOfferRevisionDocument>(
  {
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
      index: true
    },
    editedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    beforeData: {
      type: Schema.Types.Mixed,
      required: true
    },
    afterData: {
      type: Schema.Types.Mixed,
      required: true
    },
    changedFields: {
      type: [String],
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.offerId = ret.offerId ? ret.offerId.toString() : null;
        ret.editedBy = ret.editedBy ? ret.editedBy.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.offerId = ret.offerId ? ret.offerId.toString() : null;
        ret.editedBy = ret.editedBy ? ret.editedBy.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

OfferRevisionSchema.index({ createdAt: 1 });

export const OfferRevisionModel = mongoose.models.OfferRevision || mongoose.model<IOfferRevisionDocument>("OfferRevision", OfferRevisionSchema);
