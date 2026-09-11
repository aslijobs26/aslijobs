import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  WORK_ITEM_ORIGINS,
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_STATUSES,
  WORK_ITEM_TYPES,
  WORK_RELATED_ENTITY_TYPES,
} from "./operations-work.constants.js";

const workHistoryEntrySchema = new Schema(
  {
    action: { type: String, required: true, trim: true },
    at: { type: Date, required: true, default: Date.now },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
    actorName: { type: String, trim: true, default: "SYSTEM" },
    fromStatus: { type: String, trim: true, default: null },
    toStatus: { type: String, trim: true, default: null },
    note: { type: String, trim: true, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const operationsWorkItemSchema = new Schema(
  {
    displayId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 4000,
    },
    type: {
      type: String,
      enum: WORK_ITEM_TYPES,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: WORK_ITEM_PRIORITIES,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: WORK_ITEM_STATUSES,
      required: true,
      default: "queued",
      index: true,
    },
    origin: {
      type: String,
      enum: WORK_ITEM_ORIGINS,
      required: true,
      index: true,
    },
    /**
     * Deterministic key for system-generated work idempotency.
     * Sparse unique: manual work leaves this null.
     */
    sourceEventKey: {
      type: String,
      trim: true,
      default: null,
    },
    relatedEntityType: {
      type: String,
      enum: WORK_RELATED_ENTITY_TYPES,
      default: null,
      index: true,
    },
    relatedEntityId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    relatedLabel: {
      type: String,
      trim: true,
      default: "",
    },
    relatedLocationLabel: {
      type: String,
      trim: true,
      default: "",
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsDepartment",
      default: null,
      index: true,
    },
    assignedToUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
      index: true,
    },
    assignedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
      index: true,
    },
    dueAt: {
      type: Date,
      default: null,
      index: true,
    },
    slaTargetAt: {
      type: Date,
      default: null,
      index: true,
    },
    breachedAt: {
      type: Date,
      default: null,
    },
    waitingReason: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },
    completedAt: {
      type: Date,
      default: null,
      index: true,
    },
    completedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
    /** Optimistic concurrency token for assign/status CAS. */
    revision: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    history: {
      type: [workHistoryEntrySchema],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "operations_work_items",
  },
);

operationsWorkItemSchema.index(
  { sourceEventKey: 1 },
  {
    name: "sourceEventKey_unique_string",
    unique: true,
    partialFilterExpression: { sourceEventKey: { $type: "string" } },
  },
);
operationsWorkItemSchema.index({ status: 1, assignedToUserId: 1, dueAt: 1 });
operationsWorkItemSchema.index({ status: 1, departmentId: 1, dueAt: 1 });
operationsWorkItemSchema.index({ type: 1, status: 1, createdAt: -1 });
operationsWorkItemSchema.index({
  relatedEntityType: 1,
  relatedEntityId: 1,
  status: 1,
});
operationsWorkItemSchema.index({ priority: 1, status: 1, dueAt: 1 });

export type OperationsWorkItemDocument = InferSchemaType<
  typeof operationsWorkItemSchema
> & { _id: Types.ObjectId };

export const OperationsWorkItemModel = model(
  "OperationsWorkItem",
  operationsWorkItemSchema,
);
