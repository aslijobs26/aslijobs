import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  DEPARTMENT_COLORS,
  DEPARTMENT_ICONS,
  DEPARTMENT_STATUSES,
} from "./team.constants.js";

const departmentSchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameLower: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: "",
    },
    codeLower: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    headMemberId: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    headName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: DEPARTMENT_STATUSES,
      default: "active",
      index: true,
    },
    color: {
      type: String,
      enum: [...DEPARTMENT_COLORS, ""],
      default: "primary",
    },
    icon: {
      type: String,
      enum: [...DEPARTMENT_ICONS, ""],
      default: "building",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

departmentSchema.index({ employerId: 1, isDeleted: 1, status: 1 });
departmentSchema.index(
  { employerId: 1, nameLower: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);
departmentSchema.index(
  { employerId: 1, codeLower: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      codeLower: { $type: "string", $gt: "" },
    },
  },
);
departmentSchema.index({ employerId: 1, createdAt: -1 });
departmentSchema.index({
  employerId: 1,
  name: "text",
  code: "text",
  description: "text",
  headName: "text",
});

export type DepartmentDocument = InferSchemaType<typeof departmentSchema> & {
  _id: Types.ObjectId;
};

export const DepartmentModel = model("Department", departmentSchema);
