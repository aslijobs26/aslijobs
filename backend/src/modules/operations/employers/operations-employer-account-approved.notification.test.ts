import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { EmployerDocumentModel } from "../../employers/employer-document.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { notificationService } from "../../notifications/notification.service.js";
import {
  employerAccountApprovedWhatsApp,
  type EmployerAccountApprovedWhatsAppInput,
} from "../../whatsapp/notifications/employer-account-approved.notification.js";
import {
  employerAccountRejectedWhatsApp,
  type EmployerAccountRejectedWhatsAppInput,
} from "../../whatsapp/notifications/employer-account-rejected.notification.js";
import type { WhatsAppNotificationPayload } from "../../whatsapp/notifications/whatsapp-notification.types.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import { OperationsWorkItemModel } from "../work/operations-work.model.js";
import { operationsEmployersService } from "./operations-employers.service.js";

const employerId = "64f0000000000000000000aa";
const operationsUserId = "64f0000000000000000000bb";

async function flushApprovalSideEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 20));
}

function queryResult(value: unknown) {
  return {
    select() {
      return this;
    },
    sort() {
      return this;
    },
    async lean() {
      return value;
    },
  };
}

function stubApprovalSideEffects(): void {
  mock.method(operationsEmployersService, "getEmployerById", async () => ({
    verificationStatus: "verified",
  }));
  mock.method(EmployerDocumentModel, "updateMany", async () => ({
    acknowledged: true,
  }));
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

function pendingEmployer(overrides: Record<string, unknown> = {}) {
  return {
    _id: employerId,
    verificationStatus: "pending",
    whatsappNumber: "9876543210",
    companyName: "Acme Pvt Ltd",
    establishmentName: "",
    firstName: "Asha",
    lastName: "Rao",
    ...overrides,
  };
}

describe("Internal Team employer approval WhatsApp", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("triggers aslijobs_account_approved only after approval is stored", async () => {
    stubApprovalSideEffects();
    const scheduled: unknown[] = [];
    mock.method(
      employerAccountApprovedWhatsApp,
      "schedule",
      (input: EmployerAccountApprovedWhatsAppInput) => {
        scheduled.push(input);
      },
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult(pendingEmployer()),
    );
    mock.method(EmployerModel, "findOneAndUpdate", () =>
      queryResult(
        pendingEmployer({
          verificationStatus: "verified",
        }),
      ),
    );

    const result = await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "verified", remarks: "" },
      operationsUserId,
    );

    assert.equal(result.verificationStatus, "verified");
    assert.equal(scheduled.length, 1);
    const approval = scheduled[0] as EmployerAccountApprovedWhatsAppInput;
    assert.equal(approval.employerId, employerId);
    assert.equal(approval.whatsappNumber, "9876543210");
    assert.equal(approval.companyName, "Acme Pvt Ltd");
    assert.match(approval.reviewCycle, /^\d+$/);
    await flushApprovalSideEffects();
  });

  it("does not notify when the approval database update fails", async () => {
    stubApprovalSideEffects();
    const scheduled: unknown[] = [];
    mock.method(
      employerAccountApprovedWhatsApp,
      "schedule",
      (input: EmployerAccountApprovedWhatsAppInput) => {
        scheduled.push(input);
      },
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult(pendingEmployer()),
    );
    mock.method(EmployerModel, "findOneAndUpdate", () => queryResult(null));

    await assert.rejects(() =>
      operationsEmployersService.updateVerification(
        employerId,
        { verificationStatus: "verified", remarks: "" },
        operationsUserId,
      ),
    );
    assert.equal(scheduled.length, 0);
  });

  it("does not notify again when the employer is already approved", async () => {
    stubApprovalSideEffects();
    const scheduled: unknown[] = [];
    let updates = 0;
    mock.method(
      employerAccountApprovedWhatsApp,
      "schedule",
      (input: EmployerAccountApprovedWhatsAppInput) => {
        scheduled.push(input);
      },
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult(pendingEmployer({ verificationStatus: "verified" })),
    );
    mock.method(EmployerModel, "findOneAndUpdate", () => {
      updates += 1;
      return queryResult(null);
    });

    await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "verified", remarks: "" },
      operationsUserId,
    );

    assert.equal(updates, 0);
    assert.equal(scheduled.length, 0);
  });

  it("approves an employer with no WhatsApp number and skips the notification", async () => {
    stubApprovalSideEffects();
    const enqueued: WhatsAppNotificationPayload[] = [];
    mock.method(
      employerAccountApprovedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        enqueued.push(payload);
        return "queued" as const;
      },
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult(pendingEmployer({ whatsappNumber: "  " })),
    );
    mock.method(EmployerModel, "findOneAndUpdate", () =>
      queryResult(pendingEmployer({ verificationStatus: "verified", whatsappNumber: "" })),
    );

    const result = await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "verified", remarks: "" },
      operationsUserId,
    );

    assert.equal(result.verificationStatus, "verified");
    assert.equal(enqueued.length, 0);
    await flushApprovalSideEffects();
  });

  it("keeps approval successful when the WhatsApp notification fails", async () => {
    stubApprovalSideEffects();
    mock.method(employerAccountApprovedWhatsApp, "enqueue", () => {
      throw new Error("WhatsApp template delivery failed");
    });
    mock.method(EmployerModel, "findById", () =>
      queryResult(pendingEmployer()),
    );
    mock.method(EmployerModel, "findOneAndUpdate", () =>
      queryResult(pendingEmployer({ verificationStatus: "verified" })),
    );

    const result = await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "verified", remarks: "" },
      operationsUserId,
    );

    assert.equal(result.verificationStatus, "verified");
    await flushApprovalSideEffects();
  });

  it("does not send aslijobs_account_approved when Internal Team rejects", async () => {
    stubApprovalSideEffects();
    const scheduled: unknown[] = [];
    const rejected: unknown[] = [];
    mock.method(
      employerAccountApprovedWhatsApp,
      "schedule",
      (input: EmployerAccountApprovedWhatsAppInput) => {
        scheduled.push(input);
      },
    );
    mock.method(
      employerAccountRejectedWhatsApp,
      "schedule",
      (input: EmployerAccountRejectedWhatsAppInput) => {
        rejected.push(input);
      },
    );
    mock.method(EmployerModel, "findById", () =>
      queryResult(pendingEmployer()),
    );
    mock.method(EmployerModel, "findOneAndUpdate", () =>
      queryResult(pendingEmployer({ verificationStatus: "rejected" })),
    );

    await operationsEmployersService.updateVerification(
      employerId,
      { verificationStatus: "rejected", remarks: "Incomplete documents" },
      operationsUserId,
    );

    assert.equal(scheduled.length, 0);
    assert.equal(rejected.length, 1);
    await flushApprovalSideEffects();
  });

  it("passes company, establishment, or person name as {{1}} and the employer id as the CTA", async () => {
    const enqueued: WhatsAppNotificationPayload[] = [];
    mock.method(
      employerAccountApprovedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        enqueued.push(payload);
        return "queued" as const;
      },
    );

    employerAccountApprovedWhatsApp.schedule({
      employerId,
      whatsappNumber: "9876543210",
      companyName: "Acme Pvt Ltd",
      establishmentName: "Shop",
      firstName: "Asha",
      lastName: "Rao",
      reviewCycle: "1000",
    });
    employerAccountApprovedWhatsApp.schedule({
      employerId,
      whatsappNumber: "9876543210",
      companyName: "",
      establishmentName: "Rao Traders",
      firstName: "Asha",
      lastName: "Rao",
      reviewCycle: "1000",
    });
    employerAccountApprovedWhatsApp.schedule({
      employerId,
      whatsappNumber: "9876543210",
      companyName: "",
      establishmentName: "",
      firstName: "Asha",
      lastName: "Rao",
      reviewCycle: "2000",
    });
    employerAccountApprovedWhatsApp.schedule({
      employerId,
      whatsappNumber: "9876543210",
      companyName: "",
      establishmentName: "",
      firstName: "",
      lastName: "",
      reviewCycle: "2000",
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.deepEqual(
      enqueued.map((payload) => payload.employerName),
      ["Acme Pvt Ltd", "Rao Traders", "Asha Rao", "Employer"],
    );
    assert.equal(enqueued[0]?.event, "EMPLOYER_ACCOUNT_APPROVED");
    assert.equal(enqueued[0]?.entityId, employerId);
    assert.equal(enqueued[0]?.preferredLanguage, "en");
    assert.equal(enqueued[0]?.idempotencyScope, "1000");
    assert.equal(enqueued[2]?.idempotencyScope, "2000");
  });

  it("does not queue a second WhatsApp job for the same approval", async () => {
    const jobs: unknown[] = [];
    let claims = 0;
    mock.method(
      employerAccountApprovedWhatsApp,
      "enqueue",
      async (payload: WhatsAppNotificationPayload) => {
        const { enqueueWhatsAppNotification } = await import(
          "../../whatsapp/notifications/whatsapp-notification.service.js"
        );
        return enqueueWhatsAppNotification(payload, {
          claim: async () => {
            claims += 1;
            return claims === 1 ? "claimed" : "duplicate";
          },
          enqueueJob: async (job) => {
            jobs.push(job);
          },
        });
      },
    );
    const logs: string[] = [];
    mock.method(console, "info", (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });

    const input = {
      employerId,
      whatsappNumber: "9876543210",
      companyName: "Acme Pvt Ltd",
      reviewCycle: "1000",
    };
    employerAccountApprovedWhatsApp.schedule(input);
    employerAccountApprovedWhatsApp.schedule(input);
    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.equal(jobs.length, 1);
    assert.match(
      logs.join("\n"),
      /Employer approval notification skipped - already sent/,
    );
    assert.equal(logs.join("\n").includes("9876543210"), false);
  });
});
