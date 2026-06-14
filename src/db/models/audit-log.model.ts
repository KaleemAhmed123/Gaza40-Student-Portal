import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog {
  id: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface IAuditLogDocument extends Omit<IAuditLog, "id" | "actorUserId">, Document {
  actorUserId?: mongoose.Types.ObjectId | null;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.actorUserId = ret.actorUserId ? ret.actorUserId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.actorUserId = ret.actorUserId ? ret.actorUserId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: 1 });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
