import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobCounterModel } from "../../jobs/job-counter.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { jobService } from "../../jobs/job.service.js";
import type { CreateJobInput } from "../../jobs/job.validation.js";
import { OperationsDepartmentModel } from "../../operations/rbac/operations-department.model.js";
import { OperationsAuditLogModel } from "../../operations/rbac/operations-audit-log.model.js";
import { OperationsTeamUserModel } from "../../operations/auth/operations-team-user.model.js";
import { operationsJobsService } from "../../operations/jobs/operations-jobs.service.js";
import { OperationsNotificationModel } from "../../operations/registration-awareness/operations-notification.model.js";
import { OperationsWorkItemModel } from "../../operations/work/operations-work.model.js";
import { notificationService } from "../../notifications/notification.service.js";
import {
  jobPostApprovalCycle,
  jobPostApprovedWhatsApp,
  jobPostSubmissionCycle,
  jobPostSubmittedWhatsApp,
  type JobPostWhatsAppInput,
} from "./job-post-whatsapp.notification.js";
import type { WhatsAppNotificationPayload } from "./whatsapp-notification.types.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";

const employerId = "64f0000000000000000000aa";
const operationsUserId = "64f0000000000000000000bb";
const employerPhone = "9876543210";
const operationsPhone = "9000000001";

function submittedJobInput(status: "draft" | "active" = "active"): CreateJobInput {
  return {
    companyName: "Acme Pvt Ltd",
    industry: "",
    businessCategory: "",
    companySize: "",
    jobTitle: "Driver",
    jobType: "full-time",
    contractPeriodFrom: "",
    contractPeriodTo: "",
    partTimeSchedule: "",
    partTimeStartTime: "",
    partTimeEndTime: "",
    partTimeFlexibleHours: "",
    workMode: "office",
    vacancies: 1,
    description: "Drive the company van.",
    state: "telangana",
    stateName: "Telangana",
    city: "hyderabad",
    cityName: "Hyderabad",
    address: "1 Road",
    landmark: "",
    salaryType: "fixed",
    salaryPeriod: "per-month",
    fixedSalary: 20000,
    minimumSalary: null,
    maximumSalary: null,
    perks: [],
    education: ["10th_or_below"],
    experience: "fresher",
    languages: [],
    gender: [],
    minimumAge: null,
    maximumAge: null,
    walkInEnabled: false,
    interviewAddress: "",
    walkInStartDate: "",
    walkInEndDate: "",
    walkInStartTime: "",
    walkInEndTime: "",
    interviewInstructions: "",
    contactPersonName: "Asha",
    contactEmail: "asha@example.com",
    contactMobile: "9876543210",
    status,
  };
}

function employerQuery(phone: string) {
  return {
    select() {
      return this;
    },
    async lean() {
      return {
        whatsappNumber: phone,
        companyName: "Acme Pvt Ltd",
        establishmentName: "",
        firstName: "Asha",
        lastName: "Rao",
      };
    },
  };
}

describe("job post WhatsApp notification", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("queues job_post_submitted in English with the employer name and no button suffix", async () => {
    const queued: Array<{
      templateName: string;
      languageCode: string;
      bodyParameters: string[];
      urlButtonParameters?: string[];
      phoneNumber: string;
      idempotencyKey: string;
    }> = [];
    const result = await enqueueWhatsAppNotification(
      {
        event: "JOB_POST_SUBMITTED",
        entityId: "AJ-2026-000007",
        phoneNumber: employerPhone,
        employerName: "Acme Pvt Ltd",
        preferredLanguage: "en",
        idempotencyScope: jobPostSubmissionCycle(0),
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );

    assert.equal(result, "queued");
    assert.equal(queued[0]?.templateName, "job_post_submitted");
    assert.equal(queued[0]?.languageCode, "en");
    assert.deepEqual(queued[0]?.bodyParameters, ["Acme Pvt Ltd"]);
    assert.equal(queued[0]?.urlButtonParameters, undefined);
    assert.equal(queued[0]?.phoneNumber, employerPhone);
    assert.equal(
      queued[0]?.idempotencyKey,
      "JOB_POST_SUBMITTED:AJ-2026-000007:submission:1",
    );
  });

  it("does not queue a duplicate of the same submission cycle", async () => {
    let queued = 0;
    const payload = {
      event: "JOB_POST_SUBMITTED" as const,
      entityId: "AJ-2026-000007",
      phoneNumber: employerPhone,
      employerName: "Acme Pvt Ltd",
      preferredLanguage: "en" as const,
      idempotencyScope: jobPostSubmissionCycle(0),
    };
    const deps = {
      claim: async () => "duplicate" as const,
      enqueueJob: async () => {
        queued += 1;
      },
    };
    assert.equal(await enqueueWhatsAppNotification(payload, deps), "skipped_duplicate");
    assert.equal(await enqueueWhatsAppNotification(payload, deps), "skipped_duplicate");
    assert.equal(queued, 0);
  });

  it("uses a new submission cycle after a prior review", () => {
    assert.notEqual(jobPostSubmissionCycle(0), jobPostSubmissionCycle(1));
    assert.notEqual(
      jobPostApprovalCycle(new Date("2026-10-09T04:00:00.000Z")),
      jobPostApprovalCycle(new Date("2026-10-09T05:00:00.000Z")),
    );
  });

  it("sends job_post_submitted to the saved employer, not another phone", async () => {
    const phones: string[] = [];
    mock.method(EmployerModel, "findById", () => employerQuery(employerPhone));
    mock.method(jobPostSubmittedWhatsApp, "enqueue", async (payload: WhatsAppNotificationPayload) => {
      phones.push(payload.phoneNumber);
      assert.notEqual(payload.phoneNumber, operationsPhone);
      return "queued" as const;
    });

    jobPostSubmittedWhatsApp.schedule({
      employerId,
      publicJobId: "AJ-2026-000007",
      cycle: jobPostSubmissionCycle(0),
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(phones, [employerPhone]);
  });

  it("does not notify an unrelated recipient when the employer is missing", async () => {
    let queued = 0;
    mock.method(jobPostSubmittedWhatsApp, "enqueue", async () => {
      queued += 1;
      return "queued" as const;
    });

    jobPostSubmittedWhatsApp.schedule({
      employerId: "",
      publicJobId: "AJ-2026-000007",
      cycle: jobPostSubmissionCycle(0),
    });
    jobPostApprovedWhatsApp.schedule({
      employerId: "   ",
      publicJobId: "AJ-2026-000007",
      cycle: jobPostApprovalCycle(new Date()),
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(queued, 0);
  });

  it("does not throw when WhatsApp delivery fails", async () => {
    mock.method(EmployerModel, "findById", () => employerQuery(employerPhone));
    mock.method(jobPostSubmittedWhatsApp, "enqueue", async () => {
      throw new Error("meta unavailable");
    });

    jobPostSubmittedWhatsApp.schedule({
      employerId,
      publicJobId: "AJ-2026-000007",
      cycle: jobPostSubmissionCycle(0),
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

describe("job submission flows", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("notifies the employer after a submitted job enters pending review", async () => {
    const submitted: Array<{ employerId: string; publicJobId: string; cycle: string }> = [];
    mock.method(EmployerModel, "findById", async () => ({
      _id: new mongoose.Types.ObjectId(employerId),
      verificationStatus: "verified",
      companyName: "Acme Pvt Ltd",
    }));
    mock.method(JobCounterModel, "findByIdAndUpdate", async () => ({ sequence: 7 }));
    mock.method(JobModel, "create", async (doc: { jobId: string; status: string }) => ({
      ...doc,
      _id: new mongoose.Types.ObjectId(),
      reviewDecision: "",
      rejectionReason: "",
      reviewHistory: [],
    }));
    mock.method(jobPostSubmittedWhatsApp, "schedule", (input: JobPostWhatsAppInput) => {
      submitted.push(input);
    });
    mock.method(jobPostApprovedWhatsApp, "schedule", () => {
      throw new Error("approval notification is not part of submission");
    });
    stubSideEffects();

    const result = await jobService.createJob(employerId, submittedJobInput("active"));

    assert.equal(result.job.status, "pending_approval");
    assert.equal(submitted.length, 1);
    assert.equal(submitted[0]?.employerId, employerId);
    assert.equal(submitted[0]?.cycle, "submission:1");
    assert.match(submitted[0]?.publicJobId ?? "", /^AJ-\d{4}-000007$/);
  });

  it("does not notify when the job stays a draft", async () => {
    let submitted = 0;
    mock.method(EmployerModel, "findById", async () => ({
      _id: new mongoose.Types.ObjectId(employerId),
      verificationStatus: "verified",
    }));
    mock.method(JobCounterModel, "findByIdAndUpdate", async () => ({ sequence: 8 }));
    mock.method(JobModel, "create", async (doc: Record<string, unknown>) => ({
      ...doc,
      _id: new mongoose.Types.ObjectId(),
      reviewDecision: "",
      rejectionReason: "",
      reviewHistory: [],
    }));
    mock.method(jobPostSubmittedWhatsApp, "schedule", () => {
      submitted += 1;
    });
    mock.method(jobPostApprovedWhatsApp, "schedule", () => {
      submitted += 1;
    });

    const result = await jobService.createJob(employerId, submittedJobInput("draft"));
    assert.equal(result.job.status, "draft");
    assert.equal(submitted, 0);
  });

  it("does not notify when saving the job fails", async () => {
    let submitted = 0;
    mock.method(EmployerModel, "findById", async () => ({
      _id: new mongoose.Types.ObjectId(employerId),
      verificationStatus: "verified",
    }));
    mock.method(JobCounterModel, "findByIdAndUpdate", async () => ({ sequence: 9 }));
    mock.method(JobModel, "create", async () => {
      throw new Error("database unavailable");
    });
    mock.method(jobPostSubmittedWhatsApp, "schedule", () => {
      submitted += 1;
    });

    await assert.rejects(() => jobService.createJob(employerId, submittedJobInput("active")));
    assert.equal(submitted, 0);
  });

  it("uses a later cycle when a rejected job is submitted again", async () => {
    const cycles: string[] = [];
    const jobMongoId = new mongoose.Types.ObjectId().toString();
    const job = {
      _id: new mongoose.Types.ObjectId(jobMongoId),
      jobId: "AJ-2026-000044",
      status: "rejected",
      employerId: new mongoose.Types.ObjectId(employerId),
      companyId: new mongoose.Types.ObjectId(employerId),
      reviewHistory: [{ decision: "rejected" }],
      reviewDecision: "rejected",
      rejectionReason: "Fix the title",
      listingPaymentStatus: "paid",
      async save() {
        return this;
      },
    };
    mock.method(JobModel, "findOne", async () => job);
    mock.method(EmployerModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { verificationStatus: "verified" };
      },
    }));
    mock.method(jobPostSubmittedWhatsApp, "schedule", (input: JobPostWhatsAppInput) => {
      cycles.push(input.cycle);
    });
    stubSideEffects();

    const result = await jobService.publishDraft(
      employerId,
      jobMongoId,
      submittedJobInput("active"),
    );
    assert.equal(result.job.status, "pending_approval");
    assert.deepEqual(cycles, ["submission:2"]);
  });

  it("notifies the assigned employer when Internal Team publishes the job live", async () => {
    const approved: Array<{ employerId: string; publicJobId: string }> = [];
    let submitted = 0;
    const job = {
      _id: new mongoose.Types.ObjectId(),
      jobId: "AJ-2026-000055",
      status: "draft",
      creationSource: "operations",
      employerId: new mongoose.Types.ObjectId(employerId),
      companyName: "Acme Pvt Ltd",
      jobTitle: "Driver",
      listingPaymentStatus: "pending",
      reviewDecision: "",
      rejectionReason: "",
      reviewHistory: [],
      async save() {
        return this;
      },
    };
    mock.method(JobModel, "findOne", async () => job);
    mock.method(jobPostApprovedWhatsApp, "schedule", (input: JobPostWhatsAppInput) => {
      approved.push(input);
      assert.notEqual(input.employerId, operationsUserId);
    });
    mock.method(jobPostSubmittedWhatsApp, "schedule", () => {
      submitted += 1;
    });
    stubSideEffects();

    const result = await jobService.publishOperationsDraft(
      operationsUserId,
      job.jobId,
      submittedJobInput("active"),
    );

    assert.equal(result.job.status, "active");
    assert.equal(submitted, 0);
    assert.equal(approved.length, 1);
    assert.equal(approved[0]?.employerId, employerId);
    assert.equal(approved[0]?.publicJobId, "AJ-2026-000055");
  });

  it("does not notify when an operations job has no employer", async () => {
    let approved = 0;
    const job = {
      jobId: "AJ-2026-000056",
      status: "draft",
      creationSource: "operations",
      employerId: null,
      async save() {
        throw new Error("should not save");
      },
    };
    mock.method(JobModel, "findOne", async () => job);
    mock.method(jobPostApprovedWhatsApp, "schedule", () => {
      approved += 1;
    });

    await assert.rejects(() =>
      jobService.publishOperationsDraft(
        operationsUserId,
        job.jobId,
        submittedJobInput("active"),
      ),
    );
    assert.equal(approved, 0);
  });

  it("notifies the employer after Internal Team approves a pending job", async () => {
    const approved: string[] = [];
    const job = {
      _id: new mongoose.Types.ObjectId(),
      jobId: "AJ-2026-000077",
      status: "pending_approval",
      creationSource: "employer",
      employerId: new mongoose.Types.ObjectId(employerId),
      companyId: new mongoose.Types.ObjectId(employerId),
      jobTitle: "Driver",
      reviewDecision: "",
      listingPaymentStatus: "paid",
    };
    mock.method(EmployerModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { verificationStatus: "verified", whatsappNumber: operationsPhone };
      },
    }));
    mock.method(JobModel, "updateOne", async () => ({ matchedCount: 1 }));
    mock.method(OperationsTeamUserModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { fullName: "Ops User", phone: operationsPhone };
      },
    }));
    mock.method(notificationService, "notifyEmployerJobApproved", async () => ({
      created: true,
      alreadySent: false,
    }));
    mock.method(operationsJobsService, "getJobDetail", async () => ({
      jobId: job.jobId,
    }));
    mock.method(jobPostApprovedWhatsApp, "schedule", (input: JobPostWhatsAppInput) => {
      approved.push(input.employerId);
    });
    stubSideEffects();

    await operationsJobsService.approveJobWithEmployerNotification(
      job as never,
      operationsUserId,
    );
    assert.deepEqual(approved, [employerId]);
  });
});

describe("job approval WhatsApp notification", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  function pendingJob() {
    return {
      _id: new mongoose.Types.ObjectId(),
      jobId: "AJ-2026-000077",
      status: "pending_approval" as const,
      creationSource: "employer",
      employerId: new mongoose.Types.ObjectId(employerId),
      companyId: new mongoose.Types.ObjectId(employerId),
      jobTitle: "Driver",
      reviewDecision: "",
      listingPaymentStatus: "paid",
    };
  }

  function mockEmployer(phone: string) {
    mock.method(EmployerModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return {
          verificationStatus: "verified",
          whatsappNumber: phone,
          companyName: "Acme Pvt Ltd",
          establishmentName: "",
          firstName: "Asha",
          lastName: "Rao",
        };
      },
    }));
  }

  it("dispatches job_post_approved to the employer after pending review becomes live", async () => {
    const approvedAt = new Date("2026-10-09T06:00:00.000Z");
    const queued: Array<{
      templateName: string;
      languageCode: string;
      phoneNumber: string;
      bodyParameters: string[];
      urlButtonParameters?: string[];
      idempotencyKey: string;
    }> = [];
    mockEmployer(employerPhone);
    mock.method(jobPostApprovedWhatsApp, "enqueue", async (payload: WhatsAppNotificationPayload) => {
      assert.notEqual(payload.phoneNumber, operationsPhone);
      return enqueueWhatsAppNotification(payload, {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      });
    });

    jobPostApprovedWhatsApp.schedule({
      employerId,
      publicJobId: "AJ-2026-000077",
      cycle: jobPostApprovalCycle(approvedAt),
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(queued.length, 1);
    assert.equal(queued[0]?.templateName, "job_post_approved");
    assert.equal(queued[0]?.languageCode, "en");
    assert.equal(queued[0]?.phoneNumber, employerPhone);
    assert.deepEqual(queued[0]?.bodyParameters, ["Acme Pvt Ltd"]);
    assert.equal(queued[0]?.urlButtonParameters, undefined);
    assert.equal(
      queued[0]?.idempotencyKey,
      "JOB_POST_APPROVED:AJ-2026-000077:approval:2026-10-09T06:00:00.000Z",
    );
  });

  it("keeps approval successful when the employer has no WhatsApp number", async () => {
    let queued = 0;
    mockEmployer("");
    mock.method(JobModel, "updateOne", async () => ({ matchedCount: 1 }));
    mock.method(OperationsTeamUserModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { fullName: "Ops User", phone: operationsPhone };
      },
    }));
    mock.method(notificationService, "notifyEmployerJobApproved", async () => ({
      created: true,
      alreadySent: false,
    }));
    mock.method(operationsJobsService, "getJobDetail", async () => ({
      jobId: "AJ-2026-000077",
      status: "active",
    }));
    mock.method(jobPostApprovedWhatsApp, "enqueue", async () => {
      queued += 1;
      return "queued" as const;
    });
    stubSideEffects();

    const result = await operationsJobsService.approveJobWithEmployerNotification(
      pendingJob() as never,
      operationsUserId,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(result.status, "active");
    assert.equal(queued, 0);
  });

  it("does not notify an unrelated recipient when the pending job has no employer", async () => {
    let queued = 0;
    const job = pendingJob();
    job.employerId = null as never;
    job.companyId = null as never;
    mock.method(jobPostApprovedWhatsApp, "enqueue", async () => {
      queued += 1;
      return "queued" as const;
    });

    await assert.rejects(() =>
      operationsJobsService.approveJobWithEmployerNotification(
        job as never,
        operationsUserId,
      ),
    );
    assert.equal(queued, 0);
  });

  it("does not notify when the approval write does not match", async () => {
    let queued = 0;
    mock.method(EmployerModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { verificationStatus: "verified" };
      },
    }));
    mock.method(JobModel, "updateOne", async () => ({ matchedCount: 0 }));
    mock.method(jobPostApprovedWhatsApp, "enqueue", async () => {
      queued += 1;
      return "queued" as const;
    });

    await assert.rejects(() =>
      operationsJobsService.approveJobWithEmployerNotification(
        pendingJob() as never,
        operationsUserId,
      ),
    );
    assert.equal(queued, 0);
  });

  it("keeps the job approved when WhatsApp enqueue fails", async () => {
    mockEmployer(employerPhone);
    mock.method(JobModel, "updateOne", async () => ({ matchedCount: 1 }));
    mock.method(OperationsTeamUserModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { fullName: "Ops User" };
      },
    }));
    mock.method(notificationService, "notifyEmployerJobApproved", async () => ({
      created: false,
      alreadySent: false,
    }));
    mock.method(operationsJobsService, "getJobDetail", async () => ({
      jobId: "AJ-2026-000077",
      status: "active",
    }));
    mock.method(jobPostApprovedWhatsApp, "enqueue", async () => {
      throw new Error("meta unavailable");
    });
    stubSideEffects();

    const result = await operationsJobsService.approveJobWithEmployerNotification(
      pendingJob() as never,
      operationsUserId,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(result.status, "active");
  });

  it("does not dispatch a second message for the same approval or a queue retry", async () => {
    const approvedAt = new Date("2026-10-09T06:00:00.000Z");
    let queued = 0;
    const payload = {
      event: "JOB_POST_APPROVED" as const,
      entityId: "AJ-2026-000077",
      phoneNumber: employerPhone,
      employerName: "Acme Pvt Ltd",
      preferredLanguage: "en" as const,
      idempotencyScope: jobPostApprovalCycle(approvedAt),
    };
    const deps = {
      claim: async () => "duplicate" as const,
      enqueueJob: async () => {
        queued += 1;
      },
    };
    assert.equal(await enqueueWhatsAppNotification(payload, deps), "skipped_duplicate");
    assert.equal(await enqueueWhatsAppNotification(payload, deps), "skipped_duplicate");
    assert.equal(queued, 0);

    const later = await enqueueWhatsAppNotification(
      {
        ...payload,
        idempotencyScope: jobPostApprovalCycle(new Date("2026-10-09T07:00:00.000Z")),
      },
      {
        claim: async () => "claimed",
        enqueueJob: async () => {
          queued += 1;
        },
      },
    );
    assert.equal(later, "queued");
    assert.equal(queued, 1);
  });

  it("notifies the assigned employer when the status action publishes a draft live", async () => {
    const approved: string[] = [];
    let submitted = 0;
    const job = {
      _id: new mongoose.Types.ObjectId(),
      jobId: "AJ-2026-000088",
      status: "draft",
      creationSource: "operations",
      employerId: new mongoose.Types.ObjectId(employerId),
      jobTitle: "Driver",
      listingPaymentStatus: "pending",
    };
    mock.method(JobModel, "findOne", async () => job);
    mock.method(JobModel, "updateOne", async () => ({ matchedCount: 1 }));
    mock.method(OperationsTeamUserModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { fullName: "Ops User", phone: operationsPhone };
      },
    }));
    mock.method(operationsJobsService, "getJobDetail", async () => ({
      jobId: job.jobId,
      status: "active",
    }));
    mock.method(jobPostApprovedWhatsApp, "schedule", (input: JobPostWhatsAppInput) => {
      approved.push(input.employerId);
      assert.notEqual(input.employerId, operationsUserId);
    });
    mock.method(jobPostSubmittedWhatsApp, "schedule", () => {
      submitted += 1;
    });
    stubSideEffects();

    const result = await operationsJobsService.updateJobStatus(
      job.jobId,
      "publish",
      operationsUserId,
    );
    assert.equal(result.status, "active");
    assert.equal(submitted, 0);
    assert.deepEqual(approved, [employerId]);
  });

  it("does not send an approval notification when a paused job is published again", async () => {
    let approved = 0;
    const job = {
      _id: new mongoose.Types.ObjectId(),
      jobId: "AJ-2026-000089",
      status: "paused",
      creationSource: "operations",
      employerId: new mongoose.Types.ObjectId(employerId),
      jobTitle: "Driver",
      listingPaymentStatus: "paid",
    };
    mock.method(JobModel, "findOne", async () => job);
    mock.method(JobModel, "updateOne", async () => ({ matchedCount: 1 }));
    mock.method(OperationsTeamUserModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { fullName: "Ops User" };
      },
    }));
    mock.method(operationsJobsService, "getJobDetail", async () => ({
      jobId: job.jobId,
      status: "active",
    }));
    mock.method(jobPostApprovedWhatsApp, "schedule", () => {
      approved += 1;
    });
    stubSideEffects();

    await operationsJobsService.updateJobStatus(job.jobId, "publish", operationsUserId);
    assert.equal(approved, 0);
  });

  it("does not send job_post_approved when approving an already-live edit", async () => {
    let approved = 0;
    const jobId = new mongoose.Types.ObjectId();
    const job = {
      _id: jobId,
      jobId: "AJ-2026-000090",
      status: "active",
      creationSource: "employer",
      employerId: new mongoose.Types.ObjectId(employerId),
      companyId: new mongoose.Types.ObjectId(employerId),
      jobTitle: "Driver",
      liveChangeReviewStatus: "pending_approval",
      pendingLiveRevision: submittedJobInput("active"),
      listingPaymentStatus: "paid",
    };
    mock.method(EmployerModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { verificationStatus: "verified", whatsappNumber: employerPhone };
      },
    }));
    mock.method(JobModel, "findOne", async () => ({
      ...job,
      status: "active",
    }));
    mock.method(JobModel, "updateOne", async () => ({ matchedCount: 1 }));
    mock.method(OperationsTeamUserModel, "findById", () => ({
      select() {
        return this;
      },
      async lean() {
        return { fullName: "Ops User", phone: operationsPhone };
      },
    }));
    mock.method(notificationService, "notifyEmployerLiveJobChangesApproved", async () => ({
      created: true,
      alreadySent: false,
    }));
    mock.method(operationsJobsService, "getJobDetail", async () => ({
      jobId: job.jobId,
      status: "active",
    }));
    mock.method(jobPostApprovedWhatsApp, "schedule", () => {
      approved += 1;
    });
    stubSideEffects();

    const result = await operationsJobsService.approveJobWithEmployerNotification(
      job as never,
      operationsUserId,
    );
    assert.equal(result.status, "active");
    assert.equal(approved, 0);
  });
});

function stubSideEffects(): void {
  mock.method(OperationsAuditLogModel, "create", async () => ({}));
  mock.method(OperationsNotificationModel, "updateOne", async () => ({
    acknowledged: true,
  }));
  mock.method(OperationsDepartmentModel, "find", () => ({
    select() {
      return this;
    },
    async lean() {
      return [];
    },
  }));
  mock.method(OperationsWorkItemModel, "findOne", () => ({
    select() {
      return this;
    },
    async lean() {
      return null;
    },
  }));
  mock.method(OperationsWorkItemModel, "create", async () => ({
    _id: new mongoose.Types.ObjectId(),
  }));
}
