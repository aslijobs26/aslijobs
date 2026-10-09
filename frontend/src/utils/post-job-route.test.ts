import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ROUTES } from "../constants/routes";
import {
  isEmployerAccountPostJobLink,
  resolvePostJobDraftId,
} from "./post-job-route";

const employerId = "64f0000000000000000000aa";
const jobId = "64f0000000000000000000cc";

describe("post job route from the account-approval WhatsApp button", () => {
  it("treats the signed-in employer id as the new-job form", () => {
    assert.equal(isEmployerAccountPostJobLink(employerId, employerId), true);
    assert.equal(resolvePostJobDraftId(employerId, employerId), undefined);
    assert.equal(ROUTES.POST_JOB, "/post-job");
  });

  it("keeps a different id as a job draft for the existing ownership check", () => {
    assert.equal(isEmployerAccountPostJobLink(jobId, employerId), false);
    assert.equal(resolvePostJobDraftId(jobId, employerId), jobId);
    assert.equal(ROUTES.postJobEdit(jobId), `/post-job/${jobId}`);
  });

  it("does not open the create form for another employer's id", () => {
    assert.equal(
      isEmployerAccountPostJobLink("64f0000000000000000000bb", employerId),
      false,
    );
  });

  it("opens the create form when no route id is present", () => {
    assert.equal(resolvePostJobDraftId(undefined, employerId), undefined);
    assert.equal(resolvePostJobDraftId("", employerId), undefined);
  });
});
