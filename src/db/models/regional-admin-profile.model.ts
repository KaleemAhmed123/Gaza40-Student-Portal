import mongoose, { Schema, Document } from "mongoose";
import { RegionalAdminStatus } from "./enums";

export interface IRegionalAdminProfile {
  id: string;
  userId: string;
  regionId: string;
  status: RegionalAdminStatus;
  assignedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IRegionalAdminProfileDocument extends Omit<IRegionalAdminProfile, "id" | "userId" | "regionId" | "assignedByUserId">, Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  regionId: mongoose.Types.ObjectId;
  assignedByUserId?: mongoose.Types.ObjectId | null;
}

const RegionalAdminProfileSchema = new Schema<IRegionalAdminProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    regionId: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(RegionalAdminStatus),
      default: RegionalAdminStatus.active,
      index: true
    },
    assignedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
        ret.regionId = ret.regionId ? ret.regionId.toString() : null;
        ret.assignedByUserId = ret.assignedByUserId ? ret.assignedByUserId.toString() : null;
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
        ret.regionId = ret.regionId ? ret.regionId.toString() : null;
        ret.assignedByUserId = ret.assignedByUserId ? ret.assignedByUserId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const RegionalAdminProfileModel = mongoose.models.RegionalAdminProfile || mongoose.model<IRegionalAdminProfileDocument>("RegionalAdminProfile", RegionalAdminProfileSchema);
