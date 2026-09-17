import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const OPERATIONS_ORG_UNIT_TYPES = [
  "global",
  "country",
  "region",
  "state",
  "city",
  "office",
] as const;

export type OperationsOrgUnitType = (typeof OPERATIONS_ORG_UNIT_TYPES)[number];

export const OPERATIONS_ORG_UNIT_STATUSES = ["active", "archived"] as const;

const operationsOrgUnitSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: OPERATIONS_ORG_UNIT_TYPES,
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsOrgUnit",
      default: null,
      index: true,
    },
    /** Materialized ancestor path: root → … → parent (excludes self). */
    ancestorIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "OperationsOrgUnit",
        },
      ],
      default: [],
      index: true,
    },
    depth: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: OPERATIONS_ORG_UNIT_STATUSES,
      default: "active",
      index: true,
    },
    code: {
      type: String,
      trim: true,
      default: "",
      maxlength: 40,
    },
    timezone: {
      type: String,
      trim: true,
      default: "Asia/Kolkata",
      maxlength: 64,
    },
    primaryOffice: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    headUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
      index: true,
    },
    establishedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isSystemSeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
    revision: {
      type: Number,
      default: 1,
      min: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "operations_org_units",
  },
);

operationsOrgUnitSchema.index(
  { parentId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

operationsOrgUnitSchema.index(
  { type: 1, status: 1, name: 1 },
);

operationsOrgUnitSchema.index({ ancestorIds: 1, status: 1 });

export type OperationsOrgUnitDocument = InferSchemaType<
  typeof operationsOrgUnitSchema
> & { _id: Types.ObjectId };

export const OperationsOrgUnitModel = model(
  "OperationsOrgUnit",
  operationsOrgUnitSchema,
);
