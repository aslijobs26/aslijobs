import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const OPERATIONS_DEPARTMENT_STATUSES = ["active", "archived"] as const;

const operationsDepartmentSchema = new Schema(
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
    code: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 80,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 400,
    },
    status: {
      type: String,
      enum: OPERATIONS_DEPARTMENT_STATUSES,
      default: "active",
      index: true,
    },
    headUserId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsTeamUser",
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
    collection: "operations_departments",
  },
);

operationsDepartmentSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

operationsDepartmentSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active", code: { $gt: "" } },
  },
);

export type OperationsDepartmentDocument = InferSchemaType<
  typeof operationsDepartmentSchema
> & { _id: Types.ObjectId };

export const OperationsDepartmentModel = model(
  "OperationsDepartment",
  operationsDepartmentSchema,
);
