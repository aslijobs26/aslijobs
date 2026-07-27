import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  JOB_SEEKER_EDUCATION_LEVELS,
  JOB_SEEKER_EXPERIENCE_TYPES,
  JOB_SEEKER_GENDERS,
  JOB_SEEKER_JOB_TYPES,
  JOB_SEEKER_LANGUAGES,
  JOB_SEEKER_AVAILABILITY_STATUSES,
  JOB_SEEKER_REGISTRATION_STATUSES,
  JOB_SEEKER_SALARY_PERIODS,
  JOB_SEEKER_WORK_MODES,
} from "../../constants/job-seeker.constants.js";

const educationSchema = new Schema(
  {
    level: {
      type: String,
      enum: JOB_SEEKER_EDUCATION_LEVELS,
      required: true,
    },
    schoolName: { type: String, trim: true, default: "" },
    collegeName: { type: String, trim: true, default: "" },
    instituteName: { type: String, trim: true, default: "" },
    board: { type: String, trim: true, default: "" },
    stream: { type: String, trim: true, default: "" },
    trade: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    degree: { type: String, trim: true, default: "" },
    specialization: { type: String, trim: true, default: "" },
    passingYear: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const experienceEntrySchema = new Schema(
  {
    companyName: { type: String, trim: true, default: "" },
    jobRole: { type: String, trim: true, default: "" },
    industry: { type: String, trim: true, default: "" },
    startDate: { type: String, trim: true, default: "" },
    endDate: { type: String, trim: true, default: "" },
    currentlyWorking: { type: Boolean, default: false },
    duration: { type: String, trim: true, default: "" },
    salary: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

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
    jobType: {
      type: String,
      enum: JOB_SEEKER_JOB_TYPES,
      required: false,
    },
    workMode: {
      type: String,
      enum: JOB_SEEKER_WORK_MODES,
      required: false,
    },
    preferredJobLocation: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    expectedSalary: {
      type: Number,
      default: null,
    },
    expectedSalaryPeriod: {
      type: String,
      enum: JOB_SEEKER_SALARY_PERIODS,
      default: "per-month",
    },
    education: {
      type: educationSchema,
      default: null,
    },
    experienceType: {
      type: String,
      enum: JOB_SEEKER_EXPERIENCE_TYPES,
      required: false,
    },
    experiences: {
      type: [experienceEntrySchema],
      default: [],
    },
    languages: {
      type: [
        {
          type: String,
          enum: JOB_SEEKER_LANGUAGES,
        },
      ],
      default: [],
    },
    availabilityStatus: {
      type: String,
      enum: JOB_SEEKER_AVAILABILITY_STATUSES,
      required: false,
      default: null,
      index: true,
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
