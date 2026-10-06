import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isolateAddEmployerForm,
  validateAddEmployerForm,
  type AddEmployerFormState,
} from "./add-employer-form.ts";

const filledCompany: AddEmployerFormState = {
  accountType: "company",
  companyName: "Acme",
  establishmentName: "Should hide",
  firstName: "Asha",
  lastName: "Rao",
  emailAddress: "asha@example.com",
  whatsappNumber: "9876543210",
  industry: "retail-stores",
  businessCategory: "kirana-stores",
  companyStrength: "",
  minimumEmployees: "11",
  maximumEmployees: "50",
  companyAddress: "1 Main",
  pincode: "500081",
  city: "Hyderabad",
  state: "Telangana",
};

describe("isolateAddEmployerForm", () => {
  it("drops Company fields when switching to Individual", () => {
    const isolated = isolateAddEmployerForm("individual", filledCompany);
    assert.equal(isolated.companyName, "");
    assert.equal(isolated.industry, "");
    assert.equal(isolated.firstName, "Asha");
  });

  it("drops industry and employee range when switching to Consultancy", () => {
    const isolated = isolateAddEmployerForm("consultancy", filledCompany);
    assert.equal(isolated.companyName, "Acme");
    assert.equal(isolated.industry, "");
    assert.equal(isolated.minimumEmployees, "");
    assert.equal(isolated.city, "Hyderabad");
  });
});

describe("validateAddEmployerForm", () => {
  it("requires a category before other fields", () => {
    const errors = validateAddEmployerForm({
      ...filledCompany,
      accountType: "",
    });
    assert.equal(errors.accountType, "Select an employer category.");
    assert.equal(errors.firstName, undefined);
  });

  it("rejects 12345 as a WhatsApp number without submitting", () => {
    const errors = validateAddEmployerForm({
      ...filledCompany,
      whatsappNumber: "12345",
    });
    assert.equal(errors.whatsappNumber, "Enter a valid WhatsApp number.");
  });

  it("rejects invalid email", () => {
    const errors = validateAddEmployerForm({
      ...filledCompany,
      emailAddress: "not-an-email",
    });
    assert.equal(errors.emailAddress, "Enter a valid email address.");
  });

  it("rejects min greater than max for Company", () => {
    const errors = validateAddEmployerForm({
      ...filledCompany,
      minimumEmployees: "50",
      maximumEmployees: "10",
    });
    assert.equal(
      errors.maximumEmployees,
      "Maximum employees must be greater than or equal to minimum employees",
    );
  });

  it("does not require industry for Consultancy", () => {
    const errors = validateAddEmployerForm({
      ...filledCompany,
      accountType: "consultancy",
      industry: "",
      businessCategory: "",
      minimumEmployees: "",
      maximumEmployees: "",
    });
    assert.equal(errors.industry, undefined);
    assert.equal(errors.companyName, undefined);
  });
});
