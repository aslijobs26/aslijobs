import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addEmployerImageFieldId,
  addEmployerImageFieldLabel,
  isolateAddEmployerForm,
  validateAddEmployerForm,
  validateAddEmployerImageFile,
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
    assert.equal(isolated.city, "Hyderabad");
    assert.equal(isolated.state, "Telangana");
    assert.equal(isolated.companyAddress, "1 Main");
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

  it("requires location fields for Individual", () => {
    const errors = validateAddEmployerForm({
      ...filledCompany,
      accountType: "individual",
      companyName: "",
      industry: "",
      businessCategory: "",
      minimumEmployees: "",
      maximumEmployees: "",
      companyAddress: "",
      pincode: "",
      city: "",
      state: "",
    });
    assert.equal(errors.companyAddress, "Address is required.");
    assert.equal(errors.pincode, "Pincode is required.");
    assert.equal(errors.city, "City is required.");
    assert.equal(errors.state, "State is required.");
    assert.equal(errors.industry, undefined);
  });
});

describe("add employer image field", () => {
  it("uses profile photo for Individual and company photo for business categories", () => {
    assert.equal(addEmployerImageFieldId("individual"), "profilePhoto");
    assert.equal(addEmployerImageFieldId("company"), "companyLogo");
    assert.equal(addEmployerImageFieldId("consultancy"), "companyLogo");
    assert.equal(addEmployerImageFieldLabel("individual"), "Profile photo");
    assert.equal(
      addEmployerImageFieldLabel("company"),
      "Company profile photo",
    );
    assert.equal(
      addEmployerImageFieldLabel("consultancy"),
      "Company profile photo",
    );
  });

  it("rejects non-image files", () => {
    const file = new File(["x"], "id.pdf", { type: "application/pdf" });
    assert.equal(
      validateAddEmployerImageFile(file),
      "Use a PNG, JPG, JPEG, or WEBP image.",
    );
  });

  it("accepts a PNG image under 5MB", () => {
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    assert.equal(validateAddEmployerImageFile(file), null);
  });
});
