import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  RESUME_DEFAULT_GENERATION_SOURCE,
  RESUME_DEFAULT_STATUS,
  RESUME_DEFAULT_TEMPLATE_ID,
  RESUME_GENERATION_SOURCES,
  RESUME_STATUSES,
  RESUME_TEMPLATE_IDS,
  RESUME_TEMPLATE_VERSION,
} from "./resume.constants.js";

const resumeSchema = new Schema(
  {
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "JobSeeker",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: RESUME_STATUSES,
      default: RESUME_DEFAULT_STATUS,
      index: true,
    },
    templateId: {
      type: String,
      enum: RESUME_TEMPLATE_IDS,
      default: RESUME_DEFAULT_TEMPLATE_ID,
    },
    templateVersion: {
      type: String,
      trim: true,
      default: RESUME_TEMPLATE_VERSION,
    },
    versionNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    generationSource: {
      type: String,
      enum: RESUME_GENERATION_SOURCES,
      default: RESUME_DEFAULT_GENERATION_SOURCE,
    },
    profileCompletionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    resumeJson: {
      type: Schema.Types.Mixed,
      default: {},
    },
    resumeHtml: {
      type: String,
      default: "",
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: "",
    },
    pdfStorageProvider: {
      type: String,
      trim: true,
      default: "",
    },
    pdfPublicId: {
      type: String,
      trim: true,
      default: "",
    },
    pdfStoragePath: {
      type: String,
      trim: true,
      default: "",
    },
    lastGeneratedAt: {
      type: Date,
      default: null,
    },
    lastProfileSnapshotAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "resumes",
  },
);

/** One active resume document per job seeker. */
resumeSchema.index(
  { jobSeekerId: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  },
);

/** History lookup by version (future versioning APIs). */
resumeSchema.index({ jobSeekerId: 1, versionNumber: -1 });

export type ResumeDocumentLean = InferSchemaType<typeof resumeSchema> & {
  _id: Types.ObjectId;
};

export const ResumeModel = model("Resume", resumeSchema);
