import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ROUTES } from "../constants/routes";
import { resolveEmployerPostLoginPath } from "./safe-return-url";
import {
  isEmployerAccountPostJobLink,
  resolveAccountApprovalPostJobDestination,
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

  it("follows the approval button through login to /post-job without a job fetch", () => {
    const metaPath = `/post-job/%7B%7B1%7D%7D${employerId}`;
    const decodedPath = `/post-job/{{1}}${employerId}`;

    assert.equal(
      resolveAccountApprovalPostJobDestination(metaPath, employerId),
      ROUTES.POST_JOB,
    );
    assert.equal(
      resolveEmployerPostLoginPath(
        decodedPath,
        ROUTES.EMPLOYER_DASHBOARD,
        employerId,
      ),
      ROUTES.POST_JOB,
    );
    assert.equal(resolvePostJobDraftId(`{{1}}${employerId}`, employerId), undefined);
    assert.equal(
      resolvePostJobDraftId(`%7B%7B1%7D%7D${employerId}`, employerId),
      undefined,
    );
  });

  it("does not send another employer's approval button to this employer's form", () => {
    const otherEmployerId = "64f0000000000000000000bb";
    assert.equal(
      resolveEmployerPostLoginPath(
        `/post-job/{{1}}${otherEmployerId}`,
        ROUTES.EMPLOYER_DASHBOARD,
        employerId,
      ),
      `/post-job/{{1}}${otherEmployerId}`,
    );
    assert.equal(
      resolvePostJobDraftId(jobId, employerId),
      jobId,
    );
  });
});
