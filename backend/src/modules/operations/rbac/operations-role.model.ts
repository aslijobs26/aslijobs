import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const OPERATIONS_ROLE_STATUSES = ["active", "archived"] as const;

const operationsRoleGrantSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    access: {
      type: String,
      enum: ["allow"],
      default: "allow",
    },
    canDelegate: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const operationsRoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 400,
    },
    status: {
      type: String,
      enum: OPERATIONS_ROLE_STATUSES,
      default: "active",
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsDepartment",
      default: null,
      index: true,
    },
    parentRoleId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsRole",
      default: null,
      index: true,
    },
    depth: {
      type: Number,
      default: 0,
      min: 0,
    },
    canCreateRoles: {
      type: Boolean,
      default: false,
    },
    canManageUsers: {
      type: Boolean,
      default: false,
    },
    canAssignRoles: {
      type: Boolean,
      default: false,
    },
    grants: {
      type: [operationsRoleGrantSchema],
      default: [],
    },
    isSystemSeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
    legacyRoleKey: {
      type: String,
      default: null,
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
    collection: "operations_roles",
  },
);

operationsRoleSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

export type OperationsRoleGrant = {
  key: string;
  access: "allow";
  canDelegate: boolean;
};

export type OperationsRoleDocument = InferSchemaType<
  typeof operationsRoleSchema
> & { _id: Types.ObjectId };

export const OperationsRoleModel = model(
  "OperationsRole",
  operationsRoleSchema,
);
