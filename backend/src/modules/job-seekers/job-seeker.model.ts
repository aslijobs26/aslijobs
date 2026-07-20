import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  JOB_SEEKER_GENDERS,
  JOB_SEEKER_REGISTRATION_STATUSES,
} from "../../constants/job-seeker.constants.js";

const jobSeekerSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: JOB_SEEKER_GENDERS,
      required: false,
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    jobRole: {
      type: String,
      trim: true,
      default: "",
    },
    preferredJobLocation: {
      type: String,
      trim: true,
      default: "",
    },
    isWhatsappVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: JOB_SEEKER_REGISTRATION_STATUSES,
      default: "PENDING",
      index: true,
    },
    otpHash: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "jobseekers",
  },
);

export type JobSeekerDocumentLean = InferSchemaType<typeof jobSeekerSchema> & {
  _id: Types.ObjectId;
};

export const JobSeekerModel = model("JobSeeker", jobSeekerSchema);
