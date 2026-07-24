import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  JOB_EDUCATION_LEVELS,
  JOB_EXPERIENCE_LEVELS,
  JOB_GENDERS,
  JOB_LANGUAGES,
  JOB_PERKS,
  JOB_STATUSES,
  JOB_TYPES,
  PART_TIME_SCHEDULES,
  SALARY_PERIODS,
  SALARY_TYPES,
  WORK_MODES,
} from "../../constants/job.constants.js";

const jobSchema = new Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    industry: {
      type: String,
      trim: true,
      default: "",
    },
    businessCategory: {
      type: String,
      trim: true,
      default: "",
    },
    companySize: {
      type: String,
      trim: true,
      default: "",
    },
    jobTitle: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    jobType: {
      type: String,
      enum: [...JOB_TYPES, ""],
      default: "",
    },
    contractPeriodFrom: {
      type: String,
      trim: true,
      default: "",
    },
    contractPeriodTo: {
      type: String,
      trim: true,
      default: "",
    },
    partTimeSchedule: {
      type: String,
      enum: [...PART_TIME_SCHEDULES, ""],
      default: "",
    },
    partTimeStartTime: {
      type: String,
      trim: true,
      default: "",
    },
    partTimeEndTime: {
      type: String,
      trim: true,
      default: "",
    },
    partTimeFlexibleHours: {
      type: String,
      trim: true,
      default: "",
    },
    workMode: {
      type: String,
      enum: [...WORK_MODES, ""],
      default: "",
    },
    vacancies: {
      type: Number,
      default: 1,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    stateName: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    cityName: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    landmark: {
      type: String,
      trim: true,
      default: "",
    },
    salaryType: {
      type: String,
      enum: [...SALARY_TYPES, ""],
      default: "",
    },
    salaryPeriod: {
      type: String,
      enum: SALARY_PERIODS,
      default: "per-month",
    },
    fixedSalary: {
      type: Number,
      default: null,
    },
    minimumSalary: {
      type: Number,
      default: null,
    },
    maximumSalary: {
      type: Number,
      default: null,
    },
    perks: {
      type: [
        {
          type: String,
          enum: JOB_PERKS,
        },
      ],
      default: [],
    },
    education: {
      type: [
        {
          type: String,
          enum: JOB_EDUCATION_LEVELS,
        },
      ],
      default: [],
    },
    experience: {
      type: String,
      enum: [...JOB_EXPERIENCE_LEVELS, ""],
      default: "",
    },
    languages: {
      type: [
        {
          type: String,
          enum: JOB_LANGUAGES,
        },
      ],
      default: [],
    },
    gender: {
      type: [
        {
          type: String,
          enum: JOB_GENDERS,
        },
      ],
      default: [],
    },
    minimumAge: {
      type: Number,
      default: null,
    },
    maximumAge: {
      type: Number,
      default: null,
    },
    walkInEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    interviewAddress: {
      type: String,
      trim: true,
      default: "",
    },
    walkInStartDate: {
      type: String,
      trim: true,
      default: "",
    },
    walkInEndDate: {
      type: String,
      trim: true,
      default: "",
    },
    walkInStartTime: {
      type: String,
      trim: true,
      default: "",
    },
    walkInEndTime: {
      type: String,
      trim: true,
      default: "",
    },
    interviewInstructions: {
      type: String,
      trim: true,
      default: "",
    },
    contactPersonName: {
      type: String,
      trim: true,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    contactMobile: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      required: true,
      default: "active",
      index: true,
    },
    completedStep: {
      type: Number,
      min: 1,
      max: 3,
      default: 1,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
    wizardSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    reactivatedAt: {
      type: Date,
      default: null,
    },
    lastStatusChangedAt: {
      type: Date,
      default: null,
    },
    applications: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    shortlisted: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    interviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    hired: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    bookmarks: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    shares: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "jobs",
  },
);

jobSchema.index({ employerId: 1, status: 1, createdAt: -1 });
jobSchema.index({
  jobTitle: "text",
  jobId: "text",
  cityName: "text",
  stateName: "text",
  address: "text",
});

export type JobDocument = InferSchemaType<typeof jobSchema> & {
  _id: Types.ObjectId;
};

export const JobModel = model("Job", jobSchema);
