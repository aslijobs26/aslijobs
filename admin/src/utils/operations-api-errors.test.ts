import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXISTING_EMPLOYER_WHATSAPP_MESSAGE,
  EXISTING_JOB_SEEKER_WHATSAPP_MESSAGE,
  firstOperationsErrorMessage,
  getOperationsApiErrorMessage,
  getOperationsApiFieldErrors,
  isMissingApiRouteError,
} from "./operations-api-errors.ts";

function axiosError(data: {
  message?: string;
  details?: {
    code?: string;
    accountKind?: string;
    fieldErrors?: Record<string, string>;
  };
}) {
  return {
    isAxiosError: true,
    response: { data },
  };
}

describe("operations WhatsApp conflict copy", () => {
  it("names a job seeker account when the API reports accountKind=job_seeker", () => {
    const error = axiosError({
      message:
        "This mobile number is already registered with a Job Seeker account. Please log in to continue.",
      details: {
        code: "PHONE_ALREADY_REGISTERED",
        accountKind: "job_seeker",
        fieldErrors: {
          whatsappNumber:
            "This mobile number is already registered with a Job Seeker account. Please log in to continue.",
        },
      },
    });

    assert.equal(
      getOperationsApiFieldErrors(error).whatsappNumber,
      EXISTING_JOB_SEEKER_WHATSAPP_MESSAGE,
    );
    assert.equal(
      getOperationsApiErrorMessage(error),
      EXISTING_JOB_SEEKER_WHATSAPP_MESSAGE,
    );
  });

  it("names an employer account when the API reports accountKind=employer", () => {
    const error = axiosError({
      message:
        "This mobile number is already registered with an Employer account. Please log in to continue.",
      details: {
        code: "PHONE_ALREADY_REGISTERED",
        accountKind: "employer",
        fieldErrors: {
          whatsappNumber:
            "This mobile number is already registered with an Employer account. Please log in to continue.",
        },
      },
    });

    assert.equal(
      getOperationsApiFieldErrors(error).whatsappNumber,
      EXISTING_EMPLOYER_WHATSAPP_MESSAGE,
    );
    assert.equal(
      getOperationsApiErrorMessage(error),
      EXISTING_EMPLOYER_WHATSAPP_MESSAGE,
    );
  });

  it("treats Duplicate WhatsApp Number as an employer conflict", () => {
    const error = axiosError({
      message: "Duplicate WhatsApp Number",
      details: {
        fieldErrors: {
          whatsappNumber: EXISTING_EMPLOYER_WHATSAPP_MESSAGE,
        },
      },
    });

    assert.equal(
      getOperationsApiFieldErrors(error).whatsappNumber,
      EXISTING_EMPLOYER_WHATSAPP_MESSAGE,
    );
  });
});

describe("isMissingApiRouteError", () => {
  const withStatus = (status: number, message: string) => ({
    isAxiosError: true,
    response: { status, data: { success: false, message } },
  });

  it("detects the API catch-all 404", () => {
    assert.equal(isMissingApiRouteError(withStatus(404, "Route not found")), true);
  });

  it("ignores 404s for missing records and other failures", () => {
    assert.equal(isMissingApiRouteError(withStatus(404, "Employer not found")), false);
    assert.equal(isMissingApiRouteError(withStatus(500, "Route not found")), false);
    assert.equal(isMissingApiRouteError(new Error("Route not found")), false);
  });
});

describe("firstOperationsErrorMessage", () => {
  it("returns the first non-empty field error", () => {
    assert.equal(
      firstOperationsErrorMessage(
        { firstName: "First name is required.", lastName: "Last name is required." },
        "Please correct the highlighted fields.",
      ),
      "First name is required.",
    );
  });
});
