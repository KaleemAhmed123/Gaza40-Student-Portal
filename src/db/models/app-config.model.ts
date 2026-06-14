import mongoose, { Schema, Document } from "mongoose";

export interface IAppConfig {
  id: string;
  key: string;
  value: any;
  description?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppConfigDocument extends Omit<IAppConfig, "id">, Document {}

const AppConfigSchema = new Schema<IAppConfigDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    value: {
      type: Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      default: null
    },
    updatedBy: {
      type: String,
      default: null
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

export const AppConfigModel = mongoose.models.AppConfig || mongoose.model<IAppConfigDocument>("AppConfig", AppConfigSchema);
