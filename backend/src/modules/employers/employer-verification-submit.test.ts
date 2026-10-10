import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { OperationsAuditLogModel } from "../operations/rbac/operations-audit-log.model.js";
import { OperationsNotificationModel } from "../operations/registration-awareness/operations-notification.model.js";
import { EmployerDocumentModel } from "./employer-document.model.js";
import { EmployerModel } from "./employer.model.js";
import {
  employerAccountCreatedWhatsApp,
  employerService,
} from "./employer.service.js";

const employerId = "64f0000000000000000000aa";

function readyEmployer(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(employerId),
    verificationStatus: "pending",
    verificationSubmittedAt: null as Date | null,
    verificationRemarks: "",
    isProfileComplete: false,
    registrationStatus: "otp_verified",
    isWhatsappVerified: true,
    accountType: "individual",
    companyName: "",
    establishmentName: "Veeresh",
    firstName: "Veeresh",
    lastName: "Telugu",
    industry: "",
    businessCategory: "",
    companyAddress: "Madhapur",
    pincode: "500081",
    city: "Hyderabad",
    state: "Telangana",
    whatsappNumber: "9876543210",
    operationsRegistrationAwareness: null as { registeredAt?: Date } | null,
    async save(this: { verificationStatus: string }) {
      return this;
    },
    ...overrides,
  };
}

describe("first-time employer verification submission", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("rejects an incomplete profile before review or account-created WhatsApp", async () => {
    const employer = readyEmployer({ companyAddress: "", city: "" });
    let scheduled = 0;
    mock.method(EmployerModel, "findById", async () => employer);
    mock.method(EmployerDocumentModel, "countDocuments", async () => 0);
    mock.method(employerAccountCreatedWhatsApp, "schedule", () => {
      scheduled += 1;
    });

    await assert.rejects(
      () => employerService.submitVerification(employerId),
      (error: unknown) => {
        assert.equal((error as { statusCode?: number }).statusCode, 422);
        return true;
      },
    );
    assert.equal(employer.registrationStatus, "otp_verified");
    assert.equal(employer.verificationSubmittedAt, null);
    assert.equal(scheduled, 0);
  });

  it("submits a complete profile for review and sends employer_account_created once", async () => {
    const employer = readyEmployer();
    const scheduled: string[] = [];
    mock.method(EmployerModel, "findById", async () => employer);
    mock.method(EmployerDocumentModel, "countDocuments", async () => 1);
    mock.method(OperationsNotificationModel, "updateOne", async () => ({
      acknowledged: true,
    }));
    mock.method(OperationsAuditLogModel, "findOne", () => ({
      select() {
        return this;
      },
      async lean() {
        return { _id: "existing" };
      },
    }));
    mock.method(employerAccountCreatedWhatsApp, "schedule", () => {
      scheduled.push("created");
    });

    const result = await employerService.submitVerification(employerId);

    assert.equal(result.alreadySubmitted, false);
    assert.equal(result.employer.verificationStatus, "pending");
    assert.equal(employer.registrationStatus, "completed");
    assert.equal(employer.isProfileComplete, true);
    assert.ok(employer.verificationSubmittedAt instanceof Date);
    assert.deepEqual(scheduled, ["created"]);
  });

  it("does not send another account-created message when submission is repeated", async () => {
    const employer = readyEmployer({
      registrationStatus: "completed",
      isProfileComplete: true,
      verificationStatus: "pending",
      verificationSubmittedAt: new Date("2026-10-10T05:00:00.000Z"),
    });
    let scheduled = 0;
    let saved = 0;
    employer.save = async () => {
      saved += 1;
      return employer;
    };
    mock.method(EmployerModel, "findById", async () => employer);
    mock.method(employerAccountCreatedWhatsApp, "schedule", () => {
      scheduled += 1;
    });

    const result = await employerService.submitVerification(employerId);

    assert.equal(result.alreadySubmitted, true);
    assert.equal(scheduled, 0);
    assert.equal(saved, 0);
  });

  it("keeps the submitted profile when the account-created WhatsApp send fails", async () => {
    const employer = readyEmployer();
    mock.method(EmployerModel, "findById", async () => employer);
    mock.method(EmployerDocumentModel, "countDocuments", async () => 1);
    mock.method(OperationsNotificationModel, "updateOne", async () => ({
      acknowledged: true,
    }));
    mock.method(OperationsAuditLogModel, "findOne", () => ({
      select() {
        return this;
      },
      async lean() {
        return { _id: "existing" };
      },
    }));
    mock.method(employerAccountCreatedWhatsApp, "schedule", () => {
      throw new Error("whatsapp down");
    });

    const result = await employerService.submitVerification(employerId);

    assert.equal(result.alreadySubmitted, false);
    assert.equal(employer.registrationStatus, "completed");
    assert.equal(employer.verificationStatus, "pending");
  });

  it("does not send employer_account_created when a rejected employer resubmits", async () => {
    const employer = readyEmployer({
      verificationStatus: "rejected",
      registrationStatus: "completed",
      isProfileComplete: true,
      accountType: "company",
      companyName: "Acme Pvt Ltd",
      industry: "it",
      businessCategory: "software",
    });
    let created = 0;
    mock.method(EmployerModel, "findById", async () => employer);
    mock.method(EmployerDocumentModel, "countDocuments", async () => 1);
    mock.method(EmployerDocumentModel, "updateMany", async () => ({
      acknowledged: true,
    }));
    mock.method(OperationsAuditLogModel, "create", async () => ({}));
    mock.method(OperationsNotificationModel, "updateOne", async () => ({
      acknowledged: true,
    }));
    mock.method(employerAccountCreatedWhatsApp, "schedule", () => {
      created += 1;
    });

    await assert.rejects(
      () => employerService.submitVerification(employerId),
      (error: unknown) => {
        assert.equal((error as { statusCode?: number }).statusCode, 409);
        return true;
      },
    );

    const resubmitted = await employerService.resubmitVerification(employerId);
    assert.equal(resubmitted.employer.verificationStatus, "pending");
    assert.equal(created, 0);
  });
});
