import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { LOGIN_DEVICE_TYPES } from "../accounts/login-client.js";

export const EMPLOYER_LOGIN_METHODS = ["whatsapp_otp", "registration_otp"] as const;

export type EmployerLoginMethod = (typeof EMPLOYER_LOGIN_METHODS)[number];

/**
 * One row per successful employer sign-in. Holds no credentials, OTPs,
 * tokens, IP addresses or raw user-agent strings — only a coarse client
 * summary.
 */
const employerLoginEventSchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    loggedInAt: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      enum: EMPLOYER_LOGIN_METHODS,
      required: true,
    },
    client: {
      browser: { type: String, trim: true, default: "" },
      os: { type: String, trim: true, default: "" },
      deviceType: {
        type: String,
        enum: LOGIN_DEVICE_TYPES,
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
    collection: "employer_login_events",
    timestamps: false,
    versionKey: false,
  },
);

employerLoginEventSchema.index({ employerId: 1, dedupeKey: 1 }, { unique: true });
employerLoginEventSchema.index({ employerId: 1, loggedInAt: -1 });

export type EmployerLoginEventDocument = InferSchemaType<
  typeof employerLoginEventSchema
> & { _id: Types.ObjectId };

export const EmployerLoginEventModel = model(
  "EmployerLoginEvent",
  employerLoginEventSchema,
);
