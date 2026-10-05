import { Schema, model } from "mongoose";

const phoneAccountIdentitySchema = new Schema(
  {
    normalizedPhone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accountKind: {
      type: String,
      enum: ["job_seeker", "employer"],
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    lockToken: {
      type: String,
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "phone_account_identities",
  },
);

export const PhoneAccountIdentityModel = model(
  "PhoneAccountIdentity",
  phoneAccountIdentitySchema,
);
