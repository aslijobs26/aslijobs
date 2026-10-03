import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { JOB_CONTENT_LANGUAGES } from "./job-content-language.js";
import { JOB_TRANSLATION_TASK_STATUSES } from "./job-translation.policy.js";

const jobTranslationTaskSchema = new Schema(
  {
    jobMongoId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    publicJobId: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      enum: JOB_CONTENT_LANGUAGES,
      required: true,
    },
    sourceHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: JOB_TRANSLATION_TASK_STATUSES,
      required: true,
      default: "pending",
      index: true,
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
      default: "",
    },
    nextAttemptAt: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "job_translation_tasks",
  },
);

/** One in-flight or stored task per job, language, and source version. */
jobTranslationTaskSchema.index(
  { jobMongoId: 1, language: 1, sourceHash: 1 },
  { unique: true },
);
jobTranslationTaskSchema.index({ status: 1, nextAttemptAt: 1 });

export type JobTranslationTaskDocument = InferSchemaType<
  typeof jobTranslationTaskSchema
> & { _id: Types.ObjectId };

export const JobTranslationTaskModel = model(
  "JobTranslationTask",
  jobTranslationTaskSchema,
);
