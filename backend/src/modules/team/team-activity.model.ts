import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { TEAM_ACTIVITY_TYPES } from "./team.constants.js";

const teamActivitySchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: TEAM_ACTIVITY_TYPES,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "TeamRole",
      default: null,
    },
    invitationId: {
      type: Schema.Types.ObjectId,
      ref: "TeamInvitation",
      default: null,
    },
    actorEmployerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

teamActivitySchema.index({ employerId: 1, createdAt: -1 });
teamActivitySchema.index({ employerId: 1, type: 1, createdAt: -1 });

export type TeamActivityDocument = InferSchemaType<typeof teamActivitySchema> & {
  _id: Types.ObjectId;
};

export const TeamActivityModel = model("TeamActivity", teamActivitySchema);
