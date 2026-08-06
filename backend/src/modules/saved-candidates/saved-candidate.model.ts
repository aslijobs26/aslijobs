import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { SAVED_CANDIDATE_PRIORITIES } from "./saved-candidate.constants.js";

const savedCandidateSchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "JobSeeker",
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    publicJobId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    savedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    priority: {
      type: String,
      enum: SAVED_CANDIDATE_PRIORITIES,
      required: true,
      default: "medium",
      index: true,
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 40,
        },
      ],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdByTeamMemberId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    createdByName: {
      type: String,
      trim: true,
      default: "",
    },
    updatedByTeamMemberId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    updatedByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "saved_candidates",
  },
);

savedCandidateSchema.index({ employerId: 1, applicationId: 1 }, { unique: true });
savedCandidateSchema.index({ employerId: 1, savedAt: -1 });
savedCandidateSchema.index({ employerId: 1, updatedAt: -1 });
savedCandidateSchema.index({ employerId: 1, priority: 1, savedAt: -1 });

export type SavedCandidateDocument = InferSchemaType<
  typeof savedCandidateSchema
> & {
  _id: Types.ObjectId;
};

export const SavedCandidateModel = model("SavedCandidate", savedCandidateSchema);
