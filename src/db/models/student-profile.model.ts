import mongoose, { Schema, Document } from "mongoose";
import { Sex, GazaLocation, PassportStatus, PassportLocation, ProfileStatus } from "./enums";

export interface IStudentProfile {
  id: string;
  userId: string;
  fullNameEnglish?: string | null;
  sex?: Sex | null;
  dateOfBirth?: Date | null;
  locationInGaza?: GazaLocation | null;
  locationOther?: string | null;
  hasOfferSelfReported: boolean;
  hasVerifiedOffer: boolean;
  passportStatus?: PassportStatus | null;
  passportLocation?: PassportLocation | null;
  passportLocationOther?: string | null;
  emergencyContactFirstName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  englishMoi?: boolean | null;
  bachelorUniGaza?: string | null;
  englishWorkplaceCertificatePossible?: boolean | null;
  englishOtherCerts?: string | null;
  consentSigned: boolean;
  profileStatus: ProfileStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IStudentProfileDocument extends Omit<IStudentProfile, "id" | "userId" | "reviewedBy">, Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId | null;
}

const StudentProfileSchema = new Schema<IStudentProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    fullNameEnglish: {
      type: String,
      default: null
    },
    sex: {
      type: String,
      enum: Object.values(Sex),
      default: null
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    locationInGaza: {
      type: String,
      enum: Object.values(GazaLocation),
      default: null
    },
    locationOther: {
      type: String,
      default: null
    },
    hasOfferSelfReported: {
      type: Boolean,
      default: false
    },
    hasVerifiedOffer: {
      type: Boolean,
      default: false
    },
    passportStatus: {
      type: String,
      enum: Object.values(PassportStatus),
      default: null
    },
    passportLocation: {
      type: String,
      enum: Object.values(PassportLocation),
      default: null
    },
    passportLocationOther: {
      type: String,
      default: null
    },
    emergencyContactFirstName: {
      type: String,
      default: null
    },
    emergencyContactRelation: {
      type: String,
      default: null
    },
    emergencyContactPhone: {
      type: String,
      default: null
    },
    englishMoi: {
      type: Boolean,
      default: null
    },
    bachelorUniGaza: {
      type: String,
      default: null
    },
    englishWorkplaceCertificatePossible: {
      type: Boolean,
      default: null
    },
    englishOtherCerts: {
      type: String,
      default: null
    },
    consentSigned: {
      type: Boolean,
      default: false
    },
    profileStatus: {
      type: String,
      enum: Object.values(ProfileStatus),
      default: ProfileStatus.draft,
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
        ret.userId = ret.userId ? ret.userId.toString() : null;
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
        ret.reviewedBy = ret.reviewedBy ? ret.reviewedBy.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
StudentProfileSchema.index({ createdAt: 1 });

export const StudentProfileModel = mongoose.models.StudentProfile || mongoose.model<IStudentProfileDocument>("StudentProfile", StudentProfileSchema);
