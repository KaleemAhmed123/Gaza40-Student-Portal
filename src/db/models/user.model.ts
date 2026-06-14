import mongoose, { Schema, Document } from "mongoose";
import { RoleCode, AccountStatus } from "./enums";

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  roles: RoleCode[];
  accountStatus: AccountStatus;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IUserDocument extends Omit<IUser, "id">, Document {
  id: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      default: null
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    roles: {
      type: [String],
      enum: Object.values(RoleCode),
      default: []
    },
    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.active,
      index: true
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    lastLoginAt: {
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

// Indexes
UserSchema.index({ createdAt: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
