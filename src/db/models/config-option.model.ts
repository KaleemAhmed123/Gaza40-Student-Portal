import mongoose, { Schema, Document } from "mongoose";

export interface IConfigOption {
  id: string;
  groupKey: string;
  value: string;
  labelEn: string;
  labelAr?: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata?: any | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IConfigOptionDocument extends Omit<IConfigOption, "id">, Document {}

const ConfigOptionSchema = new Schema<IConfigOptionDocument>(
  {
    groupKey: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    value: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    labelEn: {
      type: String,
      required: true,
      trim: true
    },
    labelAr: {
      type: String,
      default: null
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
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
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound unique index for groupKey + value
ConfigOptionSchema.index({ groupKey: 1, value: 1 }, { unique: true });
ConfigOptionSchema.index({ groupKey: 1, isActive: 1 });

export const ConfigOptionModel = mongoose.models.ConfigOption || mongoose.model<IConfigOptionDocument>("ConfigOption", ConfigOptionSchema);
