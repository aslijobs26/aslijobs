import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const JOB_SEEKER_LOGIN_METHODS = [
  "whatsapp_otp",
  "registration_otp",
] as const;

export type JobSeekerLoginMethod = (typeof JOB_SEEKER_LOGIN_METHODS)[number];

export const JOB_SEEKER_LOGIN_DEVICE_TYPES = [
  "desktop",
  "mobile",
  "tablet",
  "unknown",
] as const;

export type JobSeekerLoginDeviceType =
  (typeof JOB_SEEKER_LOGIN_DEVICE_TYPES)[number];

/**
 * One row per successful job seeker sign-in. Holds no credentials, OTPs,
 * tokens, IP addresses or raw user-agent strings — only a coarse client
 * summary.
 */
const jobSeekerLoginEventSchema = new Schema(
  {
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "JobSeeker",
      required: true,
    },
    loggedInAt: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      enum: JOB_SEEKER_LOGIN_METHODS,
      required: true,
    },
    client: {
      browser: { type: String, trim: true, default: "" },
      os: { type: String, trim: true, default: "" },
      deviceType: {
        type: String,
        enum: JOB_SEEKER_LOGIN_DEVICE_TYPES,
        default: "unknown",
      },
    },
    /** Hash of the consumed sign-in challenge; blocks retried/duplicate writes. */
    dedupeKey: {
      type: String,
      required: true,
    },
  },
  {
    collection: "job_seeker_login_events",
    timestamps: false,
    versionKey: false,
  },
);

jobSeekerLoginEventSchema.index(
  { jobSeekerId: 1, dedupeKey: 1 },
  { unique: true },
);
jobSeekerLoginEventSchema.index({ jobSeekerId: 1, loggedInAt: -1 });

export type JobSeekerLoginEventDocument = InferSchemaType<
  typeof jobSeekerLoginEventSchema
> & { _id: Types.ObjectId };

export const JobSeekerLoginEventModel = model(
  "JobSeekerLoginEvent",
  jobSeekerLoginEventSchema,
);
