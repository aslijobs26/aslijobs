import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { TEAM_INVITATION_STATUSES } from "./team.constants.js";

const teamInvitationSchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "TeamRole",
      required: true,
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
    message: {
      type: String,
      trim: true,
      default: "",
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: TEAM_INVITATION_STATUSES,
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
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

teamInvitationSchema.index({ employerId: 1, status: 1, isDeleted: 1 });
teamInvitationSchema.index({ employerId: 1, email: 1, status: 1 });
teamInvitationSchema.index(
  { tokenHash: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false, status: "pending" },
  },
);

export type TeamInvitationDocument = InferSchemaType<
  typeof teamInvitationSchema
> & {
  _id: Types.ObjectId;
};

export const TeamInvitationModel = model("TeamInvitation", teamInvitationSchema);
