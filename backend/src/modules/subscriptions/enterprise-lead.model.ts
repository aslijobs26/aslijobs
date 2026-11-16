import { Schema, model } from "mongoose";

export const ENTERPRISE_LEAD_STATUSES = ["new", "contacted", "closed"] as const;

/** "Contact sales" requests for the Enterprise plan. */
const enterpriseLeadSchema = new Schema(
  {
    employerId: { type: Schema.Types.ObjectId, ref: "Employer", default: null, index: true },
    contactName: { type: String, trim: true, required: true },
    phone: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    companyName: { type: String, trim: true, default: "" },
    expectedMonthlyHires: { type: Number, default: null },
    message: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ENTERPRISE_LEAD_STATUSES,
      required: true,
      default: "new",
      index: true,
    },
  },
  { timestamps: true, collection: "enterprise_leads" },
);

enterpriseLeadSchema.index({ createdAt: -1 });

export const EnterpriseLeadModel = model("EnterpriseLead", enterpriseLeadSchema);
