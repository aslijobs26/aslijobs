/**
 * One-off reconciliation: create WorkItems for EXISTING open ops work
 * using the same generators as live events (not fake/demo data).
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import mongoose from "mongoose";
import {
  scheduleEmployerVerificationWork,
  scheduleJobModerationWork,
  upsertSystemWorkItem,
} from "../src/modules/operations/work/operations-work-emit.js";
import { OperationsWorkItemModel } from "../src/modules/operations/work/operations-work.model.js";

function resolveCompanyName(doc: Record<string, unknown>): string {
  const company = doc.companyName;
  if (typeof company === "string" && company.trim()) return company.trim();
  const first = typeof doc.firstName === "string" ? doc.firstName : "";
  const last = typeof doc.lastName === "string" ? doc.lastName : "";
  const name = `${first} ${last}`.trim();
  return name || "Employer";
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing");
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log("db=", db.databaseName);

  const before = await OperationsWorkItemModel.countDocuments();
  console.log("workItems.before=", before);

  const employers = await db
    .collection("employers")
    .find({
      verificationStatus: { $in: ["pending", "under_review"] },
    })
    .project({
      companyName: 1,
      firstName: 1,
      lastName: 1,
      city: 1,
      state: 1,
      verificationSubmittedAt: 1,
      verificationStatus: 1,
      updatedAt: 1,
    })
    .limit(20)
    .toArray();

  console.log("pendingEmployers=", employers.length);
  for (const emp of employers) {
    const submittedAt =
      emp.verificationSubmittedAt instanceof Date
        ? emp.verificationSubmittedAt
        : emp.updatedAt instanceof Date
          ? emp.updatedAt
          : new Date();
    const locationLabel = [emp.city, emp.state].filter(Boolean).join(", ");
    // Await upsert directly so the script can verify creation (same path as schedule*).
    const { upsertSystemWorkItem: upsert } = await import(
      "../src/modules/operations/work/operations-work-emit.js"
    );
    const key = `employer.verification_submitted:${String(emp._id)}:${submittedAt.toISOString()}`;
    const result = await upsert({
      sourceEventKey: key,
      title: "Verify Employer Documents",
      description: "Employer submitted verification documents for review.",
      type: "verification",
      priority: "P1",
      relatedEntityType: "employer",
      relatedEntityId: String(emp._id),
      relatedLabel: resolveCompanyName(emp as Record<string, unknown>),
      relatedLocationLabel: locationLabel,
      dueAt: new Date(submittedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
      actionPath: `/operations/verifications/${encodeURIComponent(String(emp._id))}`,
      metadata: {
        kind: "submitted",
        submittedAt: submittedAt.toISOString(),
        reconciled: true,
      },
    });
    console.log("employerWork=", String(emp._id), result);
  }

  const jobs = await db
    .collection("jobs")
    .find({ status: "pending_approval" })
    .project({
      jobId: 1,
      publicJobId: 1,
      title: 1,
      jobTitle: 1,
      companyName: 1,
      submittedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    .limit(20)
    .toArray();

  console.log("pendingJobs=", jobs.length);
  for (const job of jobs) {
    const submittedAt =
      job.submittedAt instanceof Date
        ? job.submittedAt
        : job.updatedAt instanceof Date
          ? job.updatedAt
          : job.createdAt instanceof Date
            ? job.createdAt
            : new Date();
    // Jobs collection stores the public id as `jobId` (callers pass it as publicJobId).
    const publicJobId = String(job.jobId ?? job.publicJobId ?? "")
      .trim()
      .toUpperCase();
    if (!publicJobId) {
      console.log("skipJob.noPublicId=", String(job._id));
      continue;
    }
    const key = `job.moderation_submitted:${publicJobId}:${submittedAt.toISOString()}`;
    const result = await upsertSystemWorkItem({
      sourceEventKey: key,
      title: "Review Job Posting",
      description: `${String(job.companyName ?? "Employer")} · ${String(job.title ?? job.jobTitle ?? "Job")}`,
      type: "job_operations",
      priority: "P2",
      relatedEntityType: "job",
      relatedEntityId: publicJobId,
      relatedLabel: String(job.companyName ?? "Employer"),
      relatedLocationLabel: "",
      dueAt: new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000),
      actionPath: `/operations/jobs/${encodeURIComponent(publicJobId)}`,
      metadata: {
        kind: "submitted",
        jobMongoId: String(job._id),
        jobTitle: String(job.title ?? job.jobTitle ?? ""),
        submittedAt: submittedAt.toISOString(),
        reconciled: true,
      },
    });
    console.log("jobWork=", publicJobId, result);
  }

  // silence unused import warnings for schedule helpers (documented as same generators)
  void scheduleEmployerVerificationWork;
  void scheduleJobModerationWork;

  const after = await OperationsWorkItemModel.countDocuments();
  const sample = await OperationsWorkItemModel.find({})
    .limit(5)
    .select(
      "displayId title status priority assignedToUserId departmentId origin sourceEventKey type",
    )
    .lean();
  console.log("workItems.after=", after);
  console.log("sample=", JSON.stringify(sample, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
