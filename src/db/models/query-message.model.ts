import mongoose, { Schema, Document } from "mongoose";

export interface IQueryMessage {
  id: string;
  queryId: string;
  senderUserId: string;
  message: string;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface IQueryMessageDocument extends Omit<IQueryMessage, "id" | "queryId" | "senderUserId">, Document {
  queryId: mongoose.Types.ObjectId;
  senderUserId: mongoose.Types.ObjectId;
}

const QueryMessageSchema = new Schema<IQueryMessageDocument>(
  {
    queryId: {
      type: Schema.Types.ObjectId,
      ref: "Query",
      required: true,
      index: true
    },
    senderUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    deletedAt: {
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
        ret.queryId = ret.queryId ? ret.queryId.toString() : null;
        ret.senderUserId = ret.senderUserId ? ret.senderUserId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.queryId = ret.queryId ? ret.queryId.toString() : null;
        ret.senderUserId = ret.senderUserId ? ret.senderUserId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

QueryMessageSchema.index({ createdAt: 1 });

export const QueryMessageModel = mongoose.models.QueryMessage || mongoose.model<IQueryMessageDocument>("QueryMessage", QueryMessageSchema);
