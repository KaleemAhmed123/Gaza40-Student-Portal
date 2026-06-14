import mongoose, { Schema, Document } from "mongoose";
import { AuthTokenType } from "./enums";

export interface IAuthToken {
  id: string;
  userId: string;
  tokenHash: string;
  type: AuthTokenType;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface IAuthTokenDocument extends Omit<IAuthToken, "id" | "userId">, Document {
  id: string;
  userId: mongoose.Types.ObjectId;
}

const AuthTokenSchema = new Schema<IAuthTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(AuthTokenType),
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    usedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : null;
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
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

AuthTokenSchema.index({ userId: 1, type: 1 });

export const AuthTokenModel = mongoose.models.AuthToken || mongoose.model<IAuthTokenDocument>("AuthToken", AuthTokenSchema);
