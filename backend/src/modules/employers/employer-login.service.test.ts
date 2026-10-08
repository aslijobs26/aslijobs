import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { PhoneAccountIdentityModel } from "../accounts/phone-account-identity.model.js";
import { otpService } from "../otp/otp.service.js";
import { EmployerModel } from "./employer.model.js";
import { employerLoginService } from "./employer-login.service.js";

const employerId = "64f0000000000000000000dd";
const nationalPhone = "9876543210";

function otpDelivery() {
  return {
    otpExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    expiresIn: 60,
    resendAvailableIn: 60,
  };
}

function mockFind(results: unknown[]) {
  mock.method(EmployerModel, "find", () => ({
    select: () => ({
      sort: () => ({
        limit: async () => results,
      }),
    }),
  }));
}

function eligibleEmployer(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    _id: new mongoose.Types.ObjectId(employerId),
    accountType: "company",
    companyName: "Veeresh Co",
    firstName: "Veeresh",
    lastName: "K",
    whatsappNumber: nationalPhone,
    status: "active",
    isWhatsappVerified: true,
    isProfileComplete: false,
    registrationStatus: "otp_verified",
    verificationStatus: "pending",
    otpHash: "hash",
    otpExpiresAt: new Date(Date.now() + 60_000),
    otpAttempts: 0,
    save: async () => undefined,
    ...overrides,
  };
}

describe("employer login send OTP", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("TEST A: Company Profile OTP-verified incomplete employer is found and login OTP is sent", async () => {
    const employer = eligibleEmployer();
    mockFind([employer]);
    mock.method(EmployerModel, "create", async () => {
      throw new Error("login must not create an employer");
    });
    const deliver = mock.method(
      otpService,
      "issueAndDeliver",
      async () => otpDelivery(),
    );

    const result = await employerLoginService.sendLoginOtp({
      whatsappNumber: nationalPhone,
    });

    assert.equal(result.employerId, employerId);
    assert.equal(deliver.mock.calls.length, 1);
    assert.equal(deliver.mock.calls[0]?.arguments[1], nationalPhone);
  });

  it("TEST B: otp_verified + WhatsApp verified + active → login allowed", async () => {
    mockFind([eligibleEmployer({ registrationStatus: "otp_verified" })]);
    mock.method(otpService, "issueAndDeliver", async () => otpDelivery());
    const result = await employerLoginService.sendLoginOtp({
      whatsappNumber: nationalPhone,
    });
    assert.equal(result.employerId, employerId);
  });

  it("TEST C: profile_incomplete + WhatsApp verified + active → login allowed", async () => {
    mockFind([
      eligibleEmployer({
        registrationStatus: "profile_incomplete",
        isProfileComplete: false,
      }),
    ]);
    mock.method(otpService, "issueAndDeliver", async () => otpDelivery());
    const result = await employerLoginService.sendLoginOtp({
      whatsappNumber: nationalPhone,
    });
    assert.equal(result.employerId, employerId);
  });

  it("TEST D: completed + WhatsApp verified + active → login allowed", async () => {
    mockFind([
      eligibleEmployer({
        registrationStatus: "completed",
        isProfileComplete: true,
      }),
    ]);
    mock.method(otpService, "issueAndDeliver", async () => otpDelivery());
    const result = await employerLoginService.sendLoginOtp({
      whatsappNumber: nationalPhone,
    });
    assert.equal(result.employerId, employerId);
  });

  it("TEST E: suspended employer → login blocked", async () => {
    mockFind([eligibleEmployer({ status: "suspended" })]);
    await assert.rejects(
      () =>
        employerLoginService.sendLoginOtp({ whatsappNumber: nationalPhone }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, HTTP_STATUS.FORBIDDEN);
        assert.match(error.message, /suspended/i);
        return true;
      },
    );
  });

  it("TEST F: inactive employer → login blocked", async () => {
    mockFind([eligibleEmployer({ status: "inactive" })]);
    await assert.rejects(
      () =>
        employerLoginService.sendLoginOtp({ whatsappNumber: nationalPhone }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, HTTP_STATUS.FORBIDDEN);
        assert.match(error.message, /inactive/i);
        return true;
      },
    );
  });

  it("TEST G: non-existent WhatsApp number → no account found", async () => {
    mockFind([]);
    mock.method(PhoneAccountIdentityModel, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    }));

    await assert.rejects(
      () =>
        employerLoginService.sendLoginOtp({ whatsappNumber: nationalPhone }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, HTTP_STATUS.NOT_FOUND);
        assert.equal(error.message, "Employer not registered.");
        return true;
      },
    );
  });

  it("TEST K: login never creates a duplicate employer", async () => {
    mockFind([eligibleEmployer()]);
    const create = mock.method(EmployerModel, "create", async () => {
      throw new Error("login must not create an employer");
    });
    mock.method(otpService, "issueAndDeliver", async () => otpDelivery());
    await employerLoginService.sendLoginOtp({ whatsappNumber: nationalPhone });
    assert.equal(create.mock.calls.length, 0);
  });

  it("finds the employer through phone_account_identities when the stored number format differs", async () => {
    mockFind([]);
    mock.method(PhoneAccountIdentityModel, "findOne", () => ({
      select: () => ({
        lean: async () => ({
          accountId: new mongoose.Types.ObjectId(employerId),
        }),
      }),
    }));
    mock.method(EmployerModel, "findById", () => ({
      select: async () => eligibleEmployer({ whatsappNumber: "+919876543210" }),
    }));
    mock.method(otpService, "issueAndDeliver", async () => otpDelivery());

    const result = await employerLoginService.sendLoginOtp({
      whatsappNumber: nationalPhone,
    });
    assert.equal(result.employerId, employerId);
  });
});
