import mongoose, { Schema, Document } from "mongoose";
import { QueryStatus } from "./enums";

export interface IQuery {
  id: string;
  studentUserId: string;
  offerId?: string | null;
  regionId?: string | null;
  queryType: string;
  title: string;
  message: string;
  status: QueryStatus;
  assignedToUserId?: string | null;
  assignedByUserId?: string | null;
  acceptedAt?: Date | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IQueryDocument extends Omit<IQuery, "id" | "studentUserId" | "offerId" | "regionId" | "assignedToUserId" | "assignedByUserId">, Document {
  studentUserId: mongoose.Types.ObjectId;
  offerId?: mongoose.Types.ObjectId | null;
  regionId?: mongoose.Types.ObjectId | null;
  assignedToUserId?: mongoose.Types.ObjectId | null;
  assignedByUserId?: mongoose.Types.ObjectId | null;
}

const QuerySchema = new Schema<IQueryDocument>(
  {
    studentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      default: null,
      index: true
    },
    regionId: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      default: null,
      index: true
    },
    queryType: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(QueryStatus),
      default: QueryStatus.open,
      index: true
    },
    assignedToUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    assignedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
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
        ret.studentUserId = ret.studentUserId ? ret.studentUserId.toString() : null;
        ret.offerId = ret.offerId ? ret.offerId.toString() : null;
        ret.regionId = ret.regionId ? ret.regionId.toString() : null;
        ret.assignedToUserId = ret.assignedToUserId ? ret.assignedToUserId.toString() : null;
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
        ret.studentUserId = ret.studentUserId ? ret.studentUserId.toString() : null;
        ret.offerId = ret.offerId ? ret.offerId.toString() : null;
        ret.regionId = ret.regionId ? ret.regionId.toString() : null;
        ret.assignedToUserId = ret.assignedToUserId ? ret.assignedToUserId.toString() : null;
        ret.assignedByUserId = ret.assignedByUserId ? ret.assignedByUserId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

QuerySchema.index({ createdAt: 1 });

export const QueryModel = mongoose.models.Query || mongoose.model<IQueryDocument>("Query", QuerySchema);
