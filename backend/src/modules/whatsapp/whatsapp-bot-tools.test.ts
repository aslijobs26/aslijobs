import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorizeWhatsAppRole } from "./whatsapp-role-policy.js";
import { selectWhatsAppTool } from "./whatsapp-bot-tools.js";

describe("whatsapp typed tool selection + auth", () => {
  it("maps intents to a finite tool set", () => {
    assert.equal(selectWhatsAppTool("JOB_SEARCH"), "search_public_jobs");
    assert.equal(selectWhatsAppTool("MY_APPLICATIONS"), "list_seeker_applications");
    assert.equal(selectWhatsAppTool("EMPLOYER_JOBS"), "list_employer_jobs");
    assert.equal(selectWhatsAppTool("ACCOUNT_STATUS"), "none");
    assert.equal(selectWhatsAppTool("GREETING"), "none");
  });

  it("does not authorize seeker job search for employer accounts", () => {
    assert.equal(
      authorizeWhatsAppRole({ account: "employer", intent: "JOB_SEARCH" }).allowed,
      false,
    );
    assert.equal(selectWhatsAppTool("JOB_SEARCH"), "search_public_jobs");
  });

  it("does not authorize employer tools for seeker accounts", () => {
    assert.equal(
      authorizeWhatsAppRole({ account: "seeker", intent: "EMPLOYER_JOBS" }).allowed,
      false,
    );
  });
});
