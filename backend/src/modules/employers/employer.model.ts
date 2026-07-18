import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  EMPLOYER_ACCOUNT_TYPES,
  EMPLOYER_REGISTRATION_STATUSES,
} from "../../constants/employer.constants.js";

const employerSchema = new Schema(
  {
    accountType: {
      type: String,
      enum: EMPLOYER_ACCOUNT_TYPES,
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
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
    companyAddress: {
      type: String,
      trim: true,
      default: "",
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
    emailAddress: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    isWhatsappVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: EMPLOYER_REGISTRATION_STATUSES,
      default: "pending_otp",
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
    documentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "EmployerDocument",
      },
    ],
  },
  {
    timestamps: true,
    collection: "employers",
  },
);

employerSchema.index({ whatsappNumber: 1, accountType: 1 });

export type EmployerDocumentLean = InferSchemaType<typeof employerSchema> & {
  _id: Types.ObjectId;
};

export const EmployerModel = model("Employer", employerSchema);
