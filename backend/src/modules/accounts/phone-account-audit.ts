import mongoose from "mongoose";
import { EmployerModel } from "../employers/employer.model.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { PhoneAccountIdentityModel } from "./phone-account-identity.model.js";

/**
 * Reports existing cross-account phone collisions.
 * Does not delete or merge accounts.
 */
export async function auditPhoneAccountUniqueness(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const [crossAccount] = await JobSeekerModel.aggregate<{ count: number }>([
    {
      $lookup: {
        from: "employers",
        localField: "whatsappNumber",
        foreignField: "whatsappNumber",
        as: "employers",
      },
    },
    { $match: { "employers.0": { $exists: true } } },
    { $count: "count" },
  ]);

  const employerDuplicateGroups = await EmployerModel.aggregate<{
    count: number;
  }>([
    { $group: { _id: "$whatsappNumber", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: "count" },
  ]);

  const crossCount = crossAccount?.count ?? 0;
  const employerGroupCount = employerDuplicateGroups[0]?.count ?? 0;

  if (crossCount === 0 && employerGroupCount === 0) {
    console.log(
      "[phone-account] No existing duplicate phones across job seekers and employers.",
    );
  } else {
    console.error(
      `[phone-account] Existing duplicates were not modified. Cross-account phones: ${crossCount}. Employer numbers used by multiple employer accounts: ${employerGroupCount}.`,
    );
  }

  try {
    await PhoneAccountIdentityModel.syncIndexes();
    await EmployerModel.collection.createIndex(
      { whatsappNumber: 1 },
      { unique: true, name: "whatsappNumber_1_unique" },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[phone-account] Unique phone index was not created because existing duplicates are still present:",
      message,
    );
  }
}
