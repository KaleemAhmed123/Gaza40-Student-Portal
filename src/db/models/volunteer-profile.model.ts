import mongoose, { Schema, Document } from "mongoose";
import { VolunteerStatus } from "./enums";

export interface IVolunteerProfile {
  id: string;
  userId: string;
  universityAffiliation?: string | null;
  preferredRegionId?: string | null;
  volunteerStatus: VolunteerStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IVolunteerProfileDocument extends Omit<IVolunteerProfile, "id" | "userId" | "preferredRegionId" | "reviewedBy">, Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  preferredRegionId?: mongoose.Types.ObjectId | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
}

const VolunteerProfileSchema = new Schema<IVolunteerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    universityAffiliation: {
      type: String,
      default: null
    },
    preferredRegionId: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
      index: true
    },
    volunteerStatus: {
      type: String,
      enum: Object.values(VolunteerStatus),
      default: VolunteerStatus.pending,
      index: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
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
        ret.userId = ret.userId ? ret.userId.toString() : null;
        ret.preferredRegionId = ret.preferredRegionId ? ret.preferredRegionId.toString() : null;
        ret.reviewedBy = ret.reviewedBy ? ret.reviewedBy.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : null;
        ret.preferredRegionId = ret.preferredRegionId ? ret.preferredRegionId.toString() : null;
        ret.reviewedBy = ret.reviewedBy ? ret.reviewedBy.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const VolunteerProfileModel = mongoose.models.VolunteerProfile || mongoose.model<IVolunteerProfileDocument>("VolunteerProfile", VolunteerProfileSchema);
