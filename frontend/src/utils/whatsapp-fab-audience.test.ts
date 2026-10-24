import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listWhatsAppFabActionIds,
  type WhatsAppFabActionId,
} from "../constants/whatsapp-welcome-messages";
import {
  resolveWhatsAppFabAudience,
  whatsappFabActionAudience,
} from "./whatsapp-fab-audience";

const idle = {
  isPending: false,
  isFetching: false,
  isSuccess: false,
  isError: false,
  hasData: false,
};

describe("whatsapp FAB audience resolution", () => {
  it("treats no auth realm as guest", () => {
    assert.equal(
      resolveWhatsAppFabAudience({
        realm: null,
        employer: idle,
        seeker: idle,
      }),
      "guest",
    );
  });

  it("stays loading while an employer /me query is in flight", () => {
    assert.equal(
      resolveWhatsAppFabAudience({
        realm: "employer",
        employer: { ...idle, isPending: true, isFetching: true },
        seeker: idle,
      }),
      "loading",
    );
  });

  it("confirms employer only after a successful /me", () => {
    assert.equal(
      resolveWhatsAppFabAudience({
        realm: "employer",
        employer: { ...idle, isSuccess: true, hasData: true },
        seeker: idle,
      }),
      "employer",
    );
  });

  it("confirms job seeker only after a successful /me", () => {
    assert.equal(
      resolveWhatsAppFabAudience({
        realm: "job-seeker",
        employer: idle,
        seeker: { ...idle, isSuccess: true, hasData: true },
      }),
      "jobseeker",
    );
  });

  it("returns unknown when authenticated /me fails", () => {
    assert.equal(
      resolveWhatsAppFabAudience({
        realm: "employer",
        employer: { ...idle, isError: true },
        seeker: idle,
      }),
      "unknown",
    );
    assert.equal(
      resolveWhatsAppFabAudience({
        realm: "job-seeker",
        employer: idle,
        seeker: { ...idle, isError: true },
      }),
      "unknown",
    );
  });

  it("does not expose action audiences while loading or unknown", () => {
    assert.equal(whatsappFabActionAudience("loading"), null);
    assert.equal(whatsappFabActionAudience("unknown"), null);
    assert.equal(whatsappFabActionAudience("guest"), "guest");
    assert.equal(whatsappFabActionAudience("jobseeker"), "jobseeker");
    assert.equal(whatsappFabActionAudience("employer"), "employer");
  });
});

describe("whatsapp FAB role action filtering", () => {
  it("gives guests only Find a Job and Hire Staff", () => {
    assert.deepEqual(listWhatsAppFabActionIds("guest"), ["find_job", "hire_staff"]);
  });

  it("gives job seekers only seeker actions", () => {
    const actions = listWhatsAppFabActionIds("jobseeker");
    assert.deepEqual(actions, [
      "find_jobs",
      "profile_jobs",
      "application_status",
      "seeker_help",
    ]);
    const forbidden: WhatsAppFabActionId[] = [
      "hire_staff",
      "post_job",
      "my_jobs",
      "employer_applications",
      "employer_help",
      "find_job",
    ];
    for (const actionId of forbidden) {
      assert.equal(actions.includes(actionId), false, actionId);
    }
  });

  it("gives employers only employer actions", () => {
    const actions = listWhatsAppFabActionIds("employer");
    assert.deepEqual(actions, [
      "post_job",
      "my_jobs",
      "employer_applications",
      "employer_help",
    ]);
    const forbidden: WhatsAppFabActionId[] = [
      "find_job",
      "find_jobs",
      "profile_jobs",
      "application_status",
      "seeker_help",
      "hire_staff",
    ];
    for (const actionId of forbidden) {
      assert.equal(actions.includes(actionId), false, actionId);
    }
  });
});
