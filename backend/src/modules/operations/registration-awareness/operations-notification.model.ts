import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  OPERATIONS_NOTIFICATION_ENTITY_TYPES,
  OPERATIONS_NOTIFICATION_TYPES,
} from "./operations-registration-awareness.constants.js";

/**
 * Workspace-scoped Operations notifications (registration + job moderation).
 * Separate from employer/job-seeker `notifications` (recipient-bound inbox).
 *
 * Read state is per Operations user via `reads[]`.
 * Deduplication uses unique `idempotencyKey` (e.g. employer.registered:{id}).
 */
const operationsNotificationReadSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      required: true,
    },
    readAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

const operationsNotificationSchema = new Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: OPERATIONS_NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      enum: OPERATIONS_NOTIFICATION_ENTITY_TYPES,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actionPath: {
      type: String,
      required: true,
      trim: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: "SYSTEM",
    },
    /**
     * When set, notification is targeted to a specific Operations user
     * (e.g. work assignment). Null = workspace broadcast.
     */
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    reads: {
      type: [operationsNotificationReadSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    collection: "operations_notifications",
    versionKey: false,
  },
);

operationsNotificationSchema.index({ createdAt: -1 });
operationsNotificationSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export type OperationsNotificationDocument = InferSchemaType<
  typeof operationsNotificationSchema
> & { _id: Types.ObjectId };

export const OperationsNotificationModel = model(
  "OperationsNotification",
  operationsNotificationSchema,
);
