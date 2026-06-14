import mongoose, { Schema, Document } from "mongoose";
import { OfferReviewStatus } from "./enums";

export interface IOffer {
  id: string;
  studentUserId: string;
  regionId: string;
  universityId?: string | null;
  universityName: string;
  courseName: string;
  courseField: string;
  courseLevel: string;
  durationYears: number;
  programmeStartDate: Date;
  offerType: string;
  conditions?: string | null;
  tuitionFeePerYear: number;
  courseFeeSourceUrl?: string | null;
  hasScholarship: boolean;
  scholarshipName?: string | null;
  scholarshipAmountPerYear?: number | null;
  scholarshipCoversLivingCost: boolean;
  privateFundingAmount: number;
  privateFundingSource?: string | null;
  livingCostLocationKey?: string | null;
  livingCostForVisa?: number | null;
  boardingFees?: number | null;
  reviewStatus: OfferReviewStatus;
  lockedForReview: boolean;
  mentorId?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IOfferDocument extends Omit<IOffer, "id" | "studentUserId" | "regionId" | "universityId" | "mentorId" | "reviewedBy">, Document {
  studentUserId: mongoose.Types.ObjectId;
  regionId: mongoose.Types.ObjectId;
  universityId?: mongoose.Types.ObjectId | null;
  mentorId?: mongoose.Types.ObjectId | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
}

const OfferSchema = new Schema<IOfferDocument>(
  {
    studentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    regionId: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true
    },
    universityId: {
      type: Schema.Types.ObjectId,
      ref: "University",
      default: null,
      index: true
    },
    universityName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    courseField: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    courseLevel: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    durationYears: {
      type: Number,
      required: true
    },
    programmeStartDate: {
      type: Date,
      required: true
    },
    offerType: {
      type: String,
      required: true,
      index: true
    },
    conditions: {
      type: String,
      default: null
    },
    tuitionFeePerYear: {
      type: Number,
      required: true
    },
    courseFeeSourceUrl: {
      type: String,
      default: null
    },
    hasScholarship: {
      type: Boolean,
      default: false
    },
    scholarshipName: {
      type: String,
      default: null
    },
    scholarshipAmountPerYear: {
      type: Number,
      default: null
    },
    scholarshipCoversLivingCost: {
      type: Boolean,
      default: false
    },
    privateFundingAmount: {
      type: Number,
      default: 0
    },
    privateFundingSource: {
      type: String,
      default: null
    },
    livingCostLocationKey: {
      type: String,
      default: null
    },
    livingCostForVisa: {
      type: Number,
      default: null
    },
    boardingFees: {
      type: Number,
      default: null
    },
    reviewStatus: {
      type: String,
      enum: Object.values(OfferReviewStatus),
      default: OfferReviewStatus.draft,
      index: true
    },
    lockedForReview: {
      type: Boolean,
      default: false
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    reviewNotes: {
      type: String,
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
        ret.regionId = ret.regionId ? ret.regionId.toString() : null;
        ret.universityId = ret.universityId ? ret.universityId.toString() : null;
        ret.mentorId = ret.mentorId ? ret.mentorId.toString() : null;
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
        ret.studentUserId = ret.studentUserId ? ret.studentUserId.toString() : null;
        ret.regionId = ret.regionId ? ret.regionId.toString() : null;
        ret.universityId = ret.universityId ? ret.universityId.toString() : null;
        ret.mentorId = ret.mentorId ? ret.mentorId.toString() : null;
        ret.reviewedBy = ret.reviewedBy ? ret.reviewedBy.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Extra Indexes
OfferSchema.index({ createdAt: 1 });

export const OfferModel = mongoose.models.Offer || mongoose.model<IOfferDocument>("Offer", OfferSchema);
