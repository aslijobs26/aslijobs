import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { RESUME_STATUSES } from "../resumes/resume.constants.js";
import { SAVED_CANDIDATE_PRIORITIES } from "../saved-candidates/saved-candidate.constants.js";
import {
  APPLICATION_DEFAULT_STATUS,
  APPLICATION_HISTORY_ACTORS,
  APPLICATION_INTERVIEW_MODES,
  APPLICATION_STATUSES,
} from "./application.constants.js";
import { APPLICATION_SHORTLIST_NEXT_ACTIONS } from "./application-shortlist.constants.js";

const statusHistoryEntrySchema = new Schema(
  {
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    actorType: {
      type: String,
      enum: APPLICATION_HISTORY_ACTORS,
      required: true,
    },
    remark: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const interviewSchema = new Schema(
  {
    date: { type: String, trim: true, default: "" },
    time: { type: String, trim: true, default: "" },
    mode: {
      type: String,
      enum: [...APPLICATION_INTERVIEW_MODES, ""],
      default: "",
    },
    meetingLink: { type: String, trim: true, default: "" },
    venue: { type: String, trim: true, default: "" },
    instructions: { type: String, trim: true, default: "" },
    interviewerName: { type: String, trim: true, default: "" },
    interviewerDesignation: { type: String, trim: true, default: "" },
    interviewerEmail: { type: String, trim: true, default: "" },
    interviewerPhone: { type: String, trim: true, default: "" },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, trim: true, default: "" },
    cancelledByName: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const offerSchema = new Schema(
  {
    offerDate: { type: String, trim: true, default: "" },
    joiningDate: { type: String, trim: true, default: "" },
    packageText: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const shortlistSchema = new Schema(
  {
    priority: {
      type: String,
      enum: SAVED_CANDIDATE_PRIORITIES,
      required: true,
      default: "medium",
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
    nextAction: {
      type: String,
      enum: APPLICATION_SHORTLIST_NEXT_ACTIONS,
      required: true,
      default: "none",
    },
    shortlistedAt: {
      type: Date,
      default: null,
    },
    shortlistedByTeamMemberId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    shortlistedByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const applicationSchema = new Schema(
  {
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
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "JobSeeker",
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    resumeVersion: {
      type: Number,
      required: true,
      min: 1,
    },
    resumeStatus: {
      type: String,
      enum: RESUME_STATUSES,
      required: true,
    },
    resumeSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: APPLICATION_DEFAULT_STATUS,
      index: true,
    },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: [],
    },
    interview: {
      type: interviewSchema,
      default: () => ({}),
    },
    offer: {
      type: offerSchema,
      default: () => ({}),
    },
    shortlist: {
      type: shortlistSchema,
      default: null,
    },
    rejectReason: {
      type: String,
      trim: true,
      default: "",
    },
    employerNotes: {
      type: String,
      trim: true,
      default: "",
    },
    employerNotesVisibleToSeeker: {
      type: Boolean,
      default: false,
    },
    employerNotesCreatedAt: {
      type: Date,
      default: null,
    },
    employerNotesUpdatedAt: {
      type: Date,
      default: null,
    },
    employerNotesUpdatedByName: {
      type: String,
      trim: true,
      default: "",
    },
    viewedAt: {
      type: Date,
      default: null,
    },
    withdrawnAt: {
      type: Date,
      default: null,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "applications",
  },
);

applicationSchema.index({ jobSeekerId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ employerId: 1, appliedAt: -1 });
applicationSchema.index({ employerId: 1, status: 1, appliedAt: -1 });
applicationSchema.index({ employerId: 1, updatedAt: -1 });
applicationSchema.index({ employerId: 1, publicJobId: 1, appliedAt: -1 });
applicationSchema.index({
  employerId: 1,
  "resumeSnapshot.resumeJson.header.fullName": 1,
});
applicationSchema.index({ jobId: 1, appliedAt: -1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ jobSeekerId: 1, appliedAt: -1 });
applicationSchema.index({ jobSeekerId: 1, status: 1 });
applicationSchema.index({ employerId: 1, jobId: 1, status: 1 });

export type ApplicationDocumentLean = InferSchemaType<
  typeof applicationSchema
> & {
  _id: Types.ObjectId;
};

export const ApplicationModel = model("Application", applicationSchema);
