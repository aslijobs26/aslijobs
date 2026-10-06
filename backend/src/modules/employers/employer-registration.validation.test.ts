import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isolateOperationsEmployerProfileFields,
  operationsCompleteEmployerProfileSchema,
  registerEmployerSchema,
} from "./employer.validation.js";

describe("registerEmployerSchema", () => {
  it("rejects a short WhatsApp number before persistence", () => {
    const result = registerEmployerSchema.safeParse({
      accountType: "company",
      companyName: "Acme",
      firstName: "Asha",
      lastName: "Rao",
      whatsappNumber: "12345",
    });

    assert.equal(result.success, false);
    if (result.success) {
      return;
    }
    assert.equal(
      result.error.issues.some(
        (issue) =>
          issue.path[0] === "whatsappNumber" &&
          issue.message === "Enter a valid WhatsApp number.",
      ),
      true,
    );
  });

  it("rejects a 10-digit number that is not a valid Indian WhatsApp number", () => {
    const result = registerEmployerSchema.safeParse({
      accountType: "company",
      companyName: "Acme",
      firstName: "Asha",
      lastName: "Rao",
      whatsappNumber: "1234567890",
    });

    assert.equal(result.success, false);
    if (result.success) {
      return;
    }
    assert.equal(
      result.error.issues.some(
        (issue) =>
          issue.path[0] === "whatsappNumber" &&
          issue.message === "Enter a valid WhatsApp number.",
      ),
      true,
    );
  });

  it("requires establishment name for Individual and ignores empty company name", () => {
    const missing = registerEmployerSchema.safeParse({
      accountType: "individual",
      companyName: "",
      establishmentName: "",
      firstName: "Asha",
      lastName: "Rao",
      whatsappNumber: "9876543210",
    });
    assert.equal(missing.success, false);

    const ok = registerEmployerSchema.safeParse({
      accountType: "individual",
      companyName: "",
      establishmentName: "Asha Kirana",
      firstName: "Asha",
      lastName: "Rao",
      whatsappNumber: "9876543210",
      emailAddress: "",
    });
    assert.equal(ok.success, true);
  });

  it("requires consultancy name for Consultancy", () => {
    const result = registerEmployerSchema.safeParse({
      accountType: "consultancy",
      companyName: "",
      firstName: "Asha",
      lastName: "Rao",
      whatsappNumber: "9876543210",
    });
    assert.equal(result.success, false);
    if (result.success) {
      return;
    }
    assert.equal(
      result.error.issues.some(
        (issue) =>
          issue.path[0] === "companyName" &&
          issue.message === "Consultancy Name is required",
      ),
      true,
    );
  });
});

describe("isolateOperationsEmployerProfileFields", () => {
  const mixed = {
    companyName: "Hidden Co",
    establishmentName: "Hidden Shop",
    industry: "retail-stores",
    businessCategory: "kirana-stores",
    minimumEmployees: 50,
    maximumEmployees: 10,
    companyAddress: "1 Main St",
    pincode: "500081",
    city: "Hyderabad",
    state: "Telangana",
  };

  it("drops company-only values when the category is Individual", () => {
    const isolated = isolateOperationsEmployerProfileFields("individual", mixed);
    assert.equal(isolated.companyName, "");
    assert.equal(isolated.industry, "");
    assert.equal(isolated.businessCategory, "");
    assert.equal(isolated.minimumEmployees, null);
    assert.equal(isolated.maximumEmployees, null);
    assert.equal(isolated.companyAddress, "");
    assert.equal(isolated.establishmentName, "Hidden Shop");
  });

  it("drops company strength and industry when the category is Consultancy", () => {
    const isolated = isolateOperationsEmployerProfileFields(
      "consultancy",
      mixed,
    );
    assert.equal(isolated.companyName, "Hidden Co");
    assert.equal(isolated.industry, "");
    assert.equal(isolated.establishmentName, "");
    assert.equal(isolated.minimumEmployees, null);
    assert.equal(isolated.city, "Hyderabad");
  });
});

describe("operationsCompleteEmployerProfileSchema", () => {
  it("rejects Company min greater than max", () => {
    const result = operationsCompleteEmployerProfileSchema.safeParse({
      accountType: "company",
      companyName: "Acme",
      industry: "retail-stores",
      businessCategory: "kirana-stores",
      minimumEmployees: 50,
      maximumEmployees: 10,
      companyAddress: "1 Main St",
      pincode: "500081",
      city: "Hyderabad",
      state: "Telangana",
    });
    assert.equal(result.success, false);
    if (result.success) {
      return;
    }
    assert.equal(
      result.error.issues.some((issue) => issue.path[0] === "maximumEmployees"),
      true,
    );
  });

  it("does not require industry or employee range for Consultancy", () => {
    const result = operationsCompleteEmployerProfileSchema.safeParse({
      accountType: "consultancy",
      companyName: "Hire Help",
      industry: "should-be-stripped",
      minimumEmployees: 99,
      maximumEmployees: 1,
      companyAddress: "2 Staff Road",
      pincode: "500081",
      city: "Hyderabad",
      state: "Telangana",
    });
    assert.equal(result.success, true);
    if (!result.success) {
      return;
    }
    assert.equal(result.data.industry, "");
    assert.equal(result.data.minimumEmployees, null);
    assert.equal(result.data.maximumEmployees, null);
  });

  it("requires industry, category, and strength for Company", () => {
    const result = operationsCompleteEmployerProfileSchema.safeParse({
      accountType: "company",
      companyName: "Acme",
      companyAddress: "1 Main St",
      pincode: "500081",
      city: "Hyderabad",
      state: "Telangana",
    });
    assert.equal(result.success, false);
  });

  it("does not require company address for Individual", () => {
    const result = operationsCompleteEmployerProfileSchema.safeParse({
      accountType: "individual",
      establishmentName: "Asha Kirana",
      companyName: "stale",
      industry: "retail-stores",
      companyAddress: "stale address",
    });
    assert.equal(result.success, true);
    if (!result.success) {
      return;
    }
    assert.equal(result.data.companyName, "");
    assert.equal(result.data.companyAddress, "");
    assert.equal(result.data.establishmentName, "Asha Kirana");
  });
});
