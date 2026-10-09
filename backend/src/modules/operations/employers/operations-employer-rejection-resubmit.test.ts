import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { EmployerDocumentModel } from "../../employers/employer-document.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { employerService } from "../../employers/employer.service.js";
import { notificationService } from "../../notifications/notification.service.js";
import { employerAccountApprovedWhatsApp } from "../../whatsapp/notifications/employer-account-approved.notification.js";
import {
  employerAccountRejectedWhatsApp,
  type EmployerAccountRejectedWhatsAppInput,
} from "../../whatsapp/notifications/employer-account-rejected.notification.js";
import { enqueueWhatsAppNotification } from "../../whatsapp/notifications/whatsapp-notification.service.js";
import type { WhatsAppNotificationPayload } from "../../whatsapp/notifications/whatsapp-notification.types.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { OperationsNotificationModel } from "../registration-awareness/operations-notification.model.js";
import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import { OperationsWorkItemModel } from "../work/operations-work.model.js";
import { operationsEmployersService } from "./operations-employers.service.js";

const employerId = "64f0000000000000000000aa";
const operationsUserId = "64f0000000000000000000bb";

function queryResult(value: unknown) {
  return {
    select() {
      return this;
    },
    async lean() {
      return value;
    },
  };
}

function pendingEmployer(overrides: Record<string, unknown> = {}) {
  return {
    _id: employerId,
    verificationStatus: "pending",
    whatsappNumber: "9876543210",
    companyName: "Acme Pvt Ltd",
    establishmentName: "",
    firstName: "Asha",
    lastName: "Rao",
    rejectedAt: new Date("2026-10-08T12:00:00.000Z"),
    ...overrides,
  };
}

function stubSideEffects(): void {
  mock.method(operationsEmployersService, "getEmployerById", async () => ({
    verificationStatus: "rejected",
  }));
  mock.method(EmployerDocumentModel, "updateMany", async () => ({
    acknowledged: true,
  }));
  mock.method(EmployerDocumentModel, "countDocuments", async () => 1);
  mock.method(OperationsTeamUserModel, "findById", () =>
    queryResult({ fullName: "Ops Reviewer" }),
  );
  mock.method(OperationsAuditLogModel, "create", async () => ({}));
  mock.method(notificationService, "notifyEmployerVerificationApproved", async () =>
    undefined,
  );
  mock.method(notificationService, "notifyEmployerVerificationRejected", async () =>
    undefined,
  );
  mock.method(OperationsWorkItemModel, "find", () => queryResult([]));
}

describe("employer rejection and resubmission", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("saves rejection and queues employer_account_rejected", async () => {
    stubSideEffects();
    const rejected: EmployerAccountRejectedWhatsAppInput[] = [];
    const approved: unknown[] = [];
    mock.method(
      employerAccountRejectedWhatsApp,
      "schedule",
      (input: EmployerAccountRejectedWhatsAppInput) => {
        rejected.push(input);
      },
    );
    mock.method(employerAccountApprovedWhatsApp, "schedule", () => {
      approved.push("approved");
    });
    mock.method(EmployerModel, "findById", () => queryResult(pendingEmployer()));
    mock.method(EmployerModel, "findOneAndUpdate", () =>
      queryResult(
        pendingEmployer({
          verificationStatus: "rejected",
          rejectedAt: new Date("2026-10-08T12:00:00.000Z"),
        }),
      ),
    );

    await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "rejected", remarks: "Incomplete GST" },
      operationsUserId,
    );

    assert.equal(rejected.length, 1);
    assert.equal(rejected[0]?.employerId, employerId);
    assert.equal(rejected[0]?.companyName, "Acme Pvt Ltd");
    assert.equal(rejected[0]?.reviewCycle, String(Date.parse("2026-10-08T12:00:00.000Z")));
    assert.equal(approved.length, 0);
  });

  it("does not notify when the rejection update fails", async () => {
    stubSideEffects();
    let scheduled = 0;
    mock.method(employerAccountRejectedWhatsApp, "schedule", () => {
      scheduled += 1;
    });
    mock.method(EmployerModel, "findById", () => queryResult(pendingEmployer()));
    mock.method(EmployerModel, "findOneAndUpdate", () => queryResult(null));

    await assert.rejects(() =>
      operationsEmployersService.updateVerification(
        employerId,
        { verificationStatus: "rejected", remarks: "Incomplete GST" },
        operationsUserId,
      ),
    );
    assert.equal(scheduled, 0);
  });

  it("keeps the rejection when WhatsApp delivery fails", async () => {
    stubSideEffects();
    mock.method(operationsEmployersService, "getEmployerById", async () => ({
      verificationStatus: "rejected",
    }));
    mock.method(employerAccountRejectedWhatsApp, "enqueue", () => {
      throw new Error("WhatsApp template delivery failed");
    });
    mock.method(EmployerModel, "findById", () => queryResult(pendingEmployer()));
    mock.method(EmployerModel, "findOneAndUpdate", () =>
      queryResult(
        pendingEmployer({
          verificationStatus: "rejected",
          rejectedAt: new Date("2026-10-08T12:00:00.000Z"),
        }),
      ),
    );

    const result = await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "rejected", remarks: "Incomplete GST" },
      operationsUserId,
    );
    assert.equal(result.verificationStatus, "rejected");
  });

  it("queues the rejected template in English with the display name and a cycle key", async () => {
    const jobs: Array<{
      templateName: string;
      languageCode: string;
      bodyParameters: string[];
      idempotencyKey: string;
      urlButtonParameters?: string[];
    }> = [];
    const payload: WhatsAppNotificationPayload = {
      event: "EMPLOYER_ACCOUNT_REJECTED",
      entityId: employerId,
      phoneNumber: "9876543210",
      employerName: "Acme Pvt Ltd",
      preferredLanguage: "te",
      idempotencyScope: "1000",
    };
    const first = await enqueueWhatsAppNotification(payload, {
      claim: async () => "claimed",
      enqueueJob: async (job) => {
        jobs.push(job);
      },
    });
    const second = await enqueueWhatsAppNotification(
      { ...payload, idempotencyScope: "2000" },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          jobs.push(job);
        },
      },
    );

    assert.equal(first, "queued");
    assert.equal(second, "queued");
    assert.equal(jobs[0]?.templateName, "employer_account_rejected");
    assert.equal(jobs[0]?.languageCode, "en");
    assert.deepEqual(jobs[0]?.bodyParameters, ["Acme Pvt Ltd"]);
    assert.equal(jobs[0]?.urlButtonParameters, undefined);
    assert.equal(
      jobs[0]?.idempotencyKey,
      `EMPLOYER_ACCOUNT_REJECTED:${employerId}:1000`,
    );
    assert.equal(
      jobs[1]?.idempotencyKey,
      `EMPLOYER_ACCOUNT_REJECTED:${employerId}:2000`,
    );
  });

  it("returns a rejected employer to pending review without approving or sending approval", async () => {
    const saved: string[] = [];
    const employer = {
      _id: new mongoose.Types.ObjectId(employerId),
      verificationStatus: "rejected",
      verificationRemarks: "Fix GST",
      isProfileComplete: true,
      registrationStatus: "completed",
      isWhatsappVerified: true,
      accountType: "company",
      companyName: "Acme Pvt Ltd",
      establishmentName: "",
      firstName: "Asha",
      lastName: "Rao",
      industry: "it",
      businessCategory: "software",
      companyAddress: "1 Road",
      pincode: "500001",
      city: "Hyderabad",
      state: "Telangana",
      whatsappNumber: "9876543210",
      cityLabel: "",
      async save() {
        saved.push(this.verificationStatus);
        return this;
      },
    };
    mock.method(EmployerModel, "findById", async () => employer);
    mock.method(EmployerDocumentModel, "countDocuments", async () => 1);
    mock.method(EmployerDocumentModel, "updateMany", async () => ({
      acknowledged: true,
    }));
    mock.method(OperationsAuditLogModel, "create", async () => ({}));
    let approved = 0;
    let rejected = 0;
    mock.method(employerAccountApprovedWhatsApp, "schedule", () => {
      approved += 1;
    });
    mock.method(employerAccountRejectedWhatsApp, "schedule", () => {
      rejected += 1;
    });
    const inbox: Array<{ type?: string; entityId?: string; actionPath?: string }> = [];
    mock.method(
      OperationsNotificationModel,
      "updateOne",
      async (
        _filter: unknown,
        update: {
          $setOnInsert?: { type?: string; entityId?: string; actionPath?: string };
        },
      ) => {
        inbox.push(update.$setOnInsert ?? {});
        return { acknowledged: true };
      },
    );

    const result = await employerService.resubmitVerification(employerId);
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(result.alreadyPending, false);
    assert.equal(result.employer.verificationStatus, "pending");
    assert.notEqual(result.employer.verificationStatus, "verified");
    assert.deepEqual(saved, ["pending"]);
    assert.equal(approved, 0);
    assert.equal(rejected, 0);
    assert.equal(inbox.length, 1);
    assert.equal(inbox[0]?.type, "employer.verification_resubmitted");
    assert.equal(inbox[0]?.entityId, employerId);
    assert.equal(
      inbox[0]?.actionPath,
      `/operations/verifications/${encodeURIComponent(employerId)}`,
    );
  });

  it("resubmits a rejected employer whose profile details and document exist even when completion flags are stale", async () => {
    const saved: string[] = [];
    const employer = {
      _id: new mongoose.Types.ObjectId(employerId),
      verificationStatus: "rejected",
      verificationRemarks: "Documents are not clear",
      isProfileComplete: false,
      registrationStatus: "profile_incomplete",
      isWhatsappVerified: true,
      accountType: "company",
      companyName: "Acme Pvt Ltd",
      establishmentName: "",
      firstName: "Asha",
      lastName: "Rao",
      industry: "it",
      businessCategory: "software",
      companyAddress: "1 Road",
      pincode: "500001",
      city: "Hyderabad",
      state: "Telangana",
      whatsappNumber: "9876543210",
      cityLabel: "",
      async save() {
        saved.push(
          `${this.verificationStatus}:${this.registrationStatus}:${this.isProfileComplete}`,
        );
        return this;
      },
    };
    mock.method(EmployerModel, "findById", async () => employer);
    mock.method(EmployerDocumentModel, "countDocuments", async () => 1);
    mock.method(EmployerDocumentModel, "updateMany", async () => ({
      acknowledged: true,
    }));
    mock.method(OperationsAuditLogModel, "create", async () => ({}));
    mock.method(
      OperationsNotificationModel,
      "updateOne",
      async () => ({ acknowledged: true }),
    );

    const result = await employerService.resubmitVerification(employerId);

    assert.equal(result.alreadyPending, false);
    assert.equal(result.employer.verificationStatus, "pending");
    assert.equal(employer.isProfileComplete, true);
    assert.equal(employer.registrationStatus, "completed");
    assert.deepEqual(saved, ["pending:completed:true"]);
  });

  it("does not resubmit when required details are still missing", async () => {
    const employer = {
      _id: new mongoose.Types.ObjectId(employerId),
      verificationStatus: "rejected",
      isProfileComplete: false,
      registrationStatus: "otp_verified",
      isWhatsappVerified: true,
      accountType: "company",
      companyName: "",
      companyAddress: "",
      pincode: "",
      city: "",
      state: "",
      async save() {
        throw new Error("should not save");
      },
    };
    mock.method(EmployerModel, "findById", async () => employer);
    mock.method(EmployerDocumentModel, "countDocuments", async () => 0);

    await assert.rejects(
      () => employerService.resubmitVerification(employerId),
      (error: unknown) => {
        assert.equal(
          (error as { statusCode?: number }).statusCode,
          422,
        );
        assert.equal(employer.verificationStatus, "rejected");
        return true;
      },
    );
  });

  it("sends approval after resubmission and another rejection on the next cycle", async () => {
    stubSideEffects();
    const approved: unknown[] = [];
    const rejected: EmployerAccountRejectedWhatsAppInput[] = [];
    mock.method(employerAccountApprovedWhatsApp, "schedule", () => {
      approved.push("approved");
    });
    mock.method(
      employerAccountRejectedWhatsApp,
      "schedule",
      (input: EmployerAccountRejectedWhatsAppInput) => {
        rejected.push(input);
      },
    );

    mock.method(EmployerModel, "findById", () =>
      queryResult(pendingEmployer({ verificationStatus: "pending" })),
    );
    mock.method(EmployerModel, "findOneAndUpdate", () =>
      queryResult(
        pendingEmployer({
          verificationStatus: "verified",
        }),
      ),
    );
    mock.method(operationsEmployersService, "getEmployerById", async () => ({
      verificationStatus: "verified",
    }));

    await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "verified", remarks: "" },
      operationsUserId,
    );
    assert.equal(approved.length, 1);
    assert.equal(rejected.length, 0);

    mock.method(operationsEmployersService, "getEmployerById", async () => ({
      verificationStatus: "rejected",
    }));
    mock.method(EmployerModel, "findById", () =>
      queryResult(pendingEmployer({ verificationStatus: "pending" })),
    );
    mock.method(EmployerModel, "findOneAndUpdate", () =>
      queryResult(
        pendingEmployer({
          verificationStatus: "rejected",
          rejectedAt: new Date("2026-10-08T13:00:00.000Z"),
        }),
      ),
    );

    await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "rejected", remarks: "Still incomplete" },
      operationsUserId,
    );
    assert.equal(rejected.length, 1);
    assert.equal(
      rejected[0]?.reviewCycle,
      String(Date.parse("2026-10-08T13:00:00.000Z")),
    );
  });
});
