import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  EMPLOYER_DOCUMENT_TYPES,
  EMPLOYER_DOCUMENT_VERIFICATION_STATUSES,
} from "../../constants/employer.constants.js";

const employerDocumentSchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: EMPLOYER_DOCUMENT_TYPES,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      trim: true,
    },
    storageProvider: {
      type: String,
      enum: ["local", "cloudinary"],
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    folder: {
      type: String,
      trim: true,
      default: "",
    },
    bucketName: {
      type: String,
      trim: true,
      default: "",
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    verificationStatus: {
      type: String,
      enum: EMPLOYER_DOCUMENT_VERIFICATION_STATUSES,
      default: "pending",
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: "employer_documents",
  },
);

export type EmployerDocumentRecord = InferSchemaType<
  typeof employerDocumentSchema
> & {
  _id: Types.ObjectId;
};

export const EmployerDocumentModel = model(
  "EmployerDocument",
  employerDocumentSchema,
);
