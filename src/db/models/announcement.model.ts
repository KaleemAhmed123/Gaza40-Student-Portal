import mongoose, { Schema, Document } from "mongoose";

export interface IAnnouncement {
  id: string;
  title: string;
  body: string;
  category?: string | null;
  createdByUserId: string;
  isPublished: boolean;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IAnnouncementDocument extends Omit<IAnnouncement, "id" | "createdByUserId">, Document {
  id: string;
  createdByUserId: mongoose.Types.ObjectId;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: null,
      index: true
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    publishedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.createdByUserId = ret.createdByUserId ? ret.createdByUserId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.createdByUserId = ret.createdByUserId ? ret.createdByUserId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

AnnouncementSchema.index({ createdAt: 1 });

export const AnnouncementModel = mongoose.models.Announcement || mongoose.model<IAnnouncementDocument>("Announcement", AnnouncementSchema);
