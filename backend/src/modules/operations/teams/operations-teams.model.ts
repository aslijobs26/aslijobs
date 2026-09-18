import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/**
 * Operations Team — first-class operational unit.
 *
 * This is NOT:
 * - OperationsDepartment (functional lane)
 * - OperationsRole (RBAC)
 * - Employer TeamMember / Department (`backend/src/modules/team/`)
 *
 * Geography lives on OperationsOrgUnit via orgUnitId.
 * Members live on OperationsTeamUser.teamId.
 */
export const OPERATIONS_TEAM_STATUSES = ["active", "archived"] as const;

const operationsTeamSchema = new Schema(
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
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 40,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 400,
    },
    status: {
      type: String,
      enum: OPERATIONS_TEAM_STATUSES,
      default: "active",
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsDepartment",
      required: true,
      index: true,
    },
    orgUnitId: {
      type: Schema.Types.ObjectId,
      ref: "OperationsOrgUnit",
      required: true,
      index: true,
    },
    leadUserId: {
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
    collection: "operations_teams",
  },
);

operationsTeamSchema.index({ departmentId: 1, status: 1 });
operationsTeamSchema.index({ orgUnitId: 1, status: 1 });
operationsTeamSchema.index(
  { departmentId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);
operationsTeamSchema.index(
  { departmentId: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  },
);

export type OperationsTeamDocument = InferSchemaType<
  typeof operationsTeamSchema
> & { _id: Types.ObjectId };

export const OperationsTeamModel = model(
  "OperationsTeam",
  operationsTeamSchema,
);
