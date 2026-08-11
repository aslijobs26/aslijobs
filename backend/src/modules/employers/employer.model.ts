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
    // Individual employers store their shop/service name in establishmentName.
    // Consultancy profile stores its business name in companyName.
    // Shared business-profile fields below are used by company + consultancy:
    // companyAddress, pincode, city, state, companyLogo, industry,
    // businessCategory, minimumEmployees, maximumEmployees.
    establishmentName: {
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
    companyDescription: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    foundedYear: {
      type: Number,
      default: null,
    },
    companyType: {
      type: String,
      trim: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: "",
    },
    roles: {
      type: String,
      trim: true,
      default: "",
    },
    minimumEmployees: {
      type: Number,
      default: null,
    },
    maximumEmployees: {
      type: Number,
      default: null,
    },
    companyLogo: {
      url: { type: String, default: "" },
      storagePath: { type: String, default: "" },
      publicId: { type: String, default: "" },
      storageProvider: { type: String, default: "" },
      originalName: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      fileSize: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
    },
    profilePhoto: {
      url: { type: String, default: "" },
      storagePath: { type: String, default: "" },
      publicId: { type: String, default: "" },
      storageProvider: { type: String, default: "" },
      originalName: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      fileSize: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
    },
    companyMedia: [
      {
        url: { type: String, default: "" },
        storagePath: { type: String, default: "" },
        publicId: { type: String, default: "" },
        storageProvider: { type: String, default: "" },
        originalName: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        fileSize: { type: Number, default: 0 },
      },
    ],
    aboutUs: {
      type: String,
      trim: true,
      default: "",
    },
    culture: {
      type: String,
      trim: true,
      default: "",
    },
    benefits: {
      type: String,
      trim: true,
      default: "",
    },
    vision: {
      type: String,
      trim: true,
      default: "",
    },
    mission: {
      type: String,
      trim: true,
      default: "",
    },
    values: {
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
    contactDesignation: {
      type: String,
      trim: true,
      default: "",
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },
    socialLinks: {
      linkedin: { type: String, trim: true, default: "" },
      facebook: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
      twitter: { type: String, trim: true, default: "" },
      youtube: { type: String, trim: true, default: "" },
    },
    profileViews: {
      type: Number,
      min: 0,
      default: 0,
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
    companyProfileVisited: {
      type: Boolean,
      default: false,
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
