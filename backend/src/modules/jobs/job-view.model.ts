import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  JOB_VIEW_VISITOR_TYPES,
  type JobViewVisitorType,
} from "./job-view.visitor.js";

/**
 * Per-visitor job view ledger (guests + authenticated job seekers).
 *
 * Uniqueness is enforced on (visitorId, jobId). Cooldown-based re-views update
 * `lastViewedAt` and increment denormalized `Job.views` — never store viewer
 * arrays on the Job document.
 */
const jobViewSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    /** Public job code (e.g. AJ-…) for reporting without joining jobs. */
    publicJobId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    visitorType: {
      type: String,
      enum: JOB_VIEW_VISITOR_TYPES,
      required: true,
    },
    /**
     * Guest UUID or job seeker ObjectId string.
     * Combined with jobId, uniquely identifies a visitor↔job pair.
     */
    visitorId: {
      type: String,
      required: true,
      trim: true,
    },
    lastViewedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "job_views",
  },
);

/** One ledger row per visitor per job (guests and seekers). */
jobViewSchema.index({ visitorId: 1, jobId: 1 }, { unique: true });

/** Per-job time-series / cooldown lookups / “views this week”. */
jobViewSchema.index({ jobId: 1, lastViewedAt: -1 });

/** Analytics by visitor type over time. */
jobViewSchema.index({ visitorType: 1, lastViewedAt: -1 });

/** Global time-window analytics. */
jobViewSchema.index({ lastViewedAt: -1 });

/** Reporting by public job code. */
jobViewSchema.index({ publicJobId: 1, lastViewedAt: -1 });

export type JobViewDocument = InferSchemaType<typeof jobViewSchema> & {
  _id: Types.ObjectId;
  visitorType: JobViewVisitorType;
};

export const JobViewModel = model("JobView", jobViewSchema);
