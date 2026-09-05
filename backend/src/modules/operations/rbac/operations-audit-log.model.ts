import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const operationsAuditLogSchema = new Schema(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: "",
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetLabel: {
      type: String,
      trim: true,
      default: "",
    },
    previousState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    nextState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "operations_audit_logs",
    versionKey: false,
  },
);

operationsAuditLogSchema.index({ createdAt: -1 });
operationsAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export type OperationsAuditLogDocument = InferSchemaType<
  typeof operationsAuditLogSchema
> & { _id: Types.ObjectId };

export const OperationsAuditLogModel = model(
  "OperationsAuditLog",
  operationsAuditLogSchema,
);
