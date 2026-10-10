import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { presentPublicRecruiterContact } from "./public-job-recruiter-contact.js";

const contact = {
  contactPersonName: "Sai",
  contactEmail: "sai@gmail.com",
  contactMobile: "9876543210",
  applyWhatsAppNumber: "9876543210",
};

describe("presentPublicRecruiterContact", () => {
  it("masks recruiter name, WhatsApp, and email for guests", () => {
    const masked = presentPublicRecruiterContact(contact, false);

    assert.equal(masked.contactPersonName, "S***i");
    assert.equal(masked.contactMobile, "******3210");
    assert.equal(masked.applyWhatsAppNumber, "******3210");
    assert.equal(masked.contactEmail, "sai***@gmail.com");
    assert.equal(masked.contactMobile?.includes("987654"), false);
    assert.equal(masked.contactEmail?.startsWith("sai@"), false);
  });

  it("returns the saved recruiter details after login", () => {
    assert.deepEqual(presentPublicRecruiterContact(contact, true), contact);
  });
});
