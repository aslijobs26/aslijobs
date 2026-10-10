import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST_JOB_INITIAL_WIZARD_DATA } from "../constants/post-job";
import { ROUTES } from "../constants/routes";
import type { EmployerJobDetail } from "../types/employer-jobs";
import { mapJobDetailToWizardState } from "./post-job-draft";
import {
  buildEmployerLoginHref,
  resolveEmployerPostLoginPath,
} from "./safe-return-url";
import {
  isEmployerAccountPostJobLink,
  resolveAccountApprovalPostJobDestination,
  resolveIncompleteDraftEditPath,
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
    const destination = resolveEmployerPostLoginPath(
      `/post-job/{{1}}${otherEmployerId}`,
      ROUTES.EMPLOYER_DASHBOARD,
      employerId,
    );
    assert.notEqual(destination, ROUTES.POST_JOB);
    assert.equal(destination, `/post-job/${otherEmployerId}`);
    assert.equal(resolvePostJobDraftId(jobId, employerId), jobId);
  });
});

describe("post job route from the incomplete-draft WhatsApp button", () => {
  const approvedButtonPath = `/post-job/%7B%7B1%7D%7D${jobId}`;
  const openedPath = `/post-job/{{1}}${jobId}`;

  it("resolves Complete Job Details to the saved draft Mongo id", () => {
    assert.equal(resolvePostJobDraftId(`{{1}}${jobId}`, employerId), jobId);
    assert.equal(
      resolvePostJobDraftId(`%7B%7B1%7D%7D${jobId}`, employerId),
      jobId,
    );
    assert.equal(
      resolveIncompleteDraftEditPath(approvedButtonPath, employerId),
      `/post-job/${jobId}`,
    );
    assert.equal(
      resolveIncompleteDraftEditPath(openedPath, employerId),
      `/post-job/${jobId}`,
    );
    assert.equal(isEmployerAccountPostJobLink(openedPath, employerId), false);
  });

  it("keeps a normal dashboard draft link unchanged", () => {
    assert.equal(resolvePostJobDraftId(jobId, employerId), jobId);
    assert.equal(
      resolveIncompleteDraftEditPath(`/post-job/${jobId}`, employerId),
      null,
    );
    assert.equal(
      resolveEmployerPostLoginPath(
        `/post-job/${jobId}`,
        ROUTES.EMPLOYER_DASHBOARD,
        employerId,
      ),
      `/post-job/${jobId}`,
    );
  });

  it("preserves the draft editor through login", () => {
    const loginHref = buildEmployerLoginHref(openedPath);
    const returnUrl = new URL(loginHref, "http://localhost").searchParams.get(
      "returnUrl",
    );
    assert.equal(
      resolveEmployerPostLoginPath(
        returnUrl,
        ROUTES.EMPLOYER_DASHBOARD,
        employerId,
      ),
      `/post-job/${jobId}`,
    );
  });

  it("does not open a new job for a malformed Complete Job Details id", () => {
    const malformed = "/post-job/{{1}}not-a-job";
    assert.equal(
      resolveEmployerPostLoginPath(
        malformed,
        ROUTES.EMPLOYER_DASHBOARD,
        employerId,
      ),
      malformed,
    );
    assert.equal(resolvePostJobDraftId("{{1}}not-a-job", employerId), "not-a-job");
    assert.notEqual(resolvePostJobDraftId("{{1}}not-a-job", employerId), undefined);
  });

  it("loads the saved draft fields for an unpublished job", () => {
    const snapshot = structuredClone(POST_JOB_INITIAL_WIZARD_DATA);
    snapshot.jobInformation.jobTitle = "Driver";
    snapshot.jobInformation.companyDetails = "Acme Pvt Ltd";
    const restored = mapJobDetailToWizardState({
      id: jobId,
      status: "draft",
      completedStep: 2,
      wizardSnapshot: snapshot,
      pendingLiveRevision: null,
    } as EmployerJobDetail);

    assert.equal(restored.activeStep, 2);
    assert.equal(restored.formData.jobInformation.jobTitle, "Driver");
    assert.equal(restored.formData.jobInformation.companyDetails, "Acme Pvt Ltd");
  });
});

describe("post job route from the job-rejected WhatsApp button", () => {
  const rejectedJobId = "6ac9ce44c00e6c85f34aa4ab";

  it("opens the rejected job editor and ignores another employer's id", () => {
    const openedPath = `/post-job/{{1}}${rejectedJobId}`;
    const routeId = `{{1}}${rejectedJobId}`;
    assert.equal(
      resolveIncompleteDraftEditPath(openedPath, employerId),
      `/post-job/${rejectedJobId}`,
    );
    assert.equal(resolvePostJobDraftId(routeId, employerId), rejectedJobId);
    assert.equal(isEmployerAccountPostJobLink(routeId, employerId), false);
    assert.equal(
      isEmployerAccountPostJobLink(rejectedJobId, employerId),
      false,
    );
    assert.equal(
      resolveEmployerPostLoginPath(
        openedPath,
        ROUTES.EMPLOYER_DASHBOARD,
        employerId,
      ),
      `/post-job/${rejectedJobId}`,
    );
  });
});
