import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  TEAM_ACCESS_LEVELS,
  TEAM_INVITATION_STATUSES,
  TEAM_MEMBER_STATUSES,
} from "./team.constants.js";

const teamMemberSchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "TeamRole",
      default: null,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
    accessLevel: {
      type: String,
      enum: TEAM_ACCESS_LEVELS,
      default: "limited",
      index: true,
    },
    status: {
      type: String,
      enum: TEAM_MEMBER_STATUSES,
      default: "invited",
      index: true,
    },
    invitationStatus: {
      type: String,
      enum: [...TEAM_INVITATION_STATUSES, ""],
      default: "pending",
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      default: null,
    },
    invitationId: {
      type: Schema.Types.ObjectId,
      ref: "TeamInvitation",
      default: null,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    passwordHash: {
      type: String,
      default: "",
      select: false,
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

teamMemberSchema.index({ employerId: 1, status: 1, isDeleted: 1 });
teamMemberSchema.index({ employerId: 1, departmentId: 1, isDeleted: 1 });
teamMemberSchema.index({ employerId: 1, roleId: 1, isDeleted: 1 });
teamMemberSchema.index({ employerId: 1, invitationStatus: 1, isDeleted: 1 });
teamMemberSchema.index({ employerId: 1, fullName: 1 });
teamMemberSchema.index({ employerId: 1, joinedAt: -1 });
teamMemberSchema.index({ employerId: 1, lastActiveAt: -1 });
teamMemberSchema.index(
  { employerId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

export type TeamMemberDocument = InferSchemaType<typeof teamMemberSchema> & {
  _id: Types.ObjectId;
};

export const TeamMemberModel = model("TeamMember", teamMemberSchema);
