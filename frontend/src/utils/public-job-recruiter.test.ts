import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPublicJobRecruiterDetails } from "./public-job-recruiter";

describe("getPublicJobRecruiterDetails", () => {
  it("keeps name, WhatsApp, and email for the public Recruiter section", () => {
    const details = getPublicJobRecruiterDetails({
      contactPersonName: "Uma Maheshwari",
      applyWhatsAppNumber: "9059210480",
      contactEmail: "uma.maheshwari@justdail.com",
    });

    assert.equal(details.hasDetails, true);
    assert.equal(details.name, "Uma Maheshwari");
    assert.equal(details.whatsapp, "9059210480");
    assert.equal(details.email, "uma.maheshwari@justdail.com");
  });

  it("falls back to contactMobile when applyWhatsAppNumber is missing", () => {
    const details = getPublicJobRecruiterDetails({
      contactPersonName: "Uma Maheshwari",
      applyWhatsAppNumber: null,
      contactMobile: "905921048",
      contactEmail: "uma.maheshwari@justdail.com",
    });

    assert.equal(details.whatsapp, "905921048");
    assert.equal(details.email, "uma.maheshwari@justdail.com");
  });
});
