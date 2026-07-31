import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  TEAM_ACCESS_LEVELS,
  TEAM_ROLE_COLORS,
  TEAM_ROLE_ICONS,
  TEAM_ROLE_STATUSES,
} from "./team.constants.js";

const teamRoleSchema = new Schema(
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
    description: {
      type: String,
      trim: true,
      default: "",
    },
    accessLevel: {
      type: String,
      enum: TEAM_ACCESS_LEVELS,
      default: "limited",
    },
    status: {
      type: String,
      enum: TEAM_ROLE_STATUSES,
      default: "active",
      index: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    color: {
      type: String,
      enum: [...TEAM_ROLE_COLORS, ""],
      default: "primary",
    },
    icon: {
      type: String,
      enum: [...TEAM_ROLE_ICONS, ""],
      default: "shield",
    },
    permissions: {
      type: Schema.Types.Mixed,
      default: null,
    },
    fieldAccess: {
      type: Schema.Types.Mixed,
      default: null,
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

teamRoleSchema.index({ employerId: 1, status: 1, isDeleted: 1 });
teamRoleSchema.index({ employerId: 1, isSystem: 1, isDeleted: 1 });
teamRoleSchema.index({ employerId: 1, createdAt: -1 });
teamRoleSchema.index({ employerId: 1, updatedAt: -1 });
teamRoleSchema.index(
  { employerId: 1, nameLower: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

export type TeamRoleDocument = InferSchemaType<typeof teamRoleSchema> & {
  _id: Types.ObjectId;
};

export const TeamRoleModel = model("TeamRole", teamRoleSchema);
