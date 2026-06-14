import mongoose, { Schema, Document } from "mongoose";

export interface IUniversity {
  id: string;
  regionId: string;
  name: string;
  city?: string | null;
  isLondon: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IUniversityDocument extends Omit<IUniversity, "id" | "regionId">, Document {
  id: string;
  regionId: mongoose.Types.ObjectId;
}

const UniversitySchema = new Schema<IUniversityDocument>(
  {
    regionId: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    city: {
      type: String,
      default: null
    },
    isLondon: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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
        ret.regionId = ret.regionId ? ret.regionId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.regionId = ret.regionId ? ret.regionId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound unique index for regionId + name
UniversitySchema.index({ regionId: 1, name: 1 }, { unique: true });

export const UniversityModel = mongoose.models.University || mongoose.model<IUniversityDocument>("University", UniversitySchema);
