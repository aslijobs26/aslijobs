import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { ROUTES } from "../constants/routes";
import {
  buildEmployerLoginHref,
  getSafeReturnUrl,
  resolveEmployerPostLoginPath,
} from "./safe-return-url";

function readSource(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

const RESUBMIT_PATH = "/employer/company-profile";

describe("Resubmit Details route", () => {
  it("uses the existing company profile route", () => {
    assert.equal(ROUTES.EMPLOYER_COMPANY_PROFILE, RESUBMIT_PATH);
    assert.equal(getSafeReturnUrl(RESUBMIT_PATH), RESUBMIT_PATH);
  });

  it("sends an unauthenticated employer to login and back to the profile", () => {
    assert.equal(
      buildEmployerLoginHref(RESUBMIT_PATH),
      "/employer/login?returnUrl=%2Femployer%2Fcompany-profile",
    );
    assert.equal(resolveEmployerPostLoginPath(RESUBMIT_PATH), RESUBMIT_PATH);
  });

  it("rejects an external return URL", () => {
    assert.equal(
      getSafeReturnUrl("https://evil.example/employer/company-profile"),
      null,
    );
    assert.equal(
      resolveEmployerPostLoginPath("https://evil.example/employer/company-profile"),
      ROUTES.EMPLOYER_DASHBOARD,
    );
  });
});

describe("rejected employer profile wiring", () => {
  it("keeps company profile behind the existing auth guard and in-app handoff", () => {
    const page = readSource(
      "../app/employer/(workspace)/company-profile/page.tsx",
    );
    const layout = readSource("../app/employer/(workspace)/layout.tsx");
    const shell = readSource(
      "../components/employer-dashboard/EmployerDashboardLayout.tsx",
    );
    const guard = readSource(
      "../components/employer-dashboard/EmployerAuthGuard.tsx",
    );
    assert.match(page, /EmployerProfilePageContent/);
    assert.match(layout, /EmployerDashboardLayout/);
    assert.match(shell, /EmployerAuthGuard/);
    assert.match(guard, /detectInAppBrowser/);
    assert.match(guard, /buildEmployerLoginHref/);
    assert.match(guard, /InAppBrowserHandoff/);
  });

  it("shows rejected and pending review states and submits through the backend", () => {
    const profile = readSource(
      "../components/employer-profile/EmployerProfilePageContent.tsx",
    );
    assert.match(profile, /verificationStatus === "rejected"/);
    assert.match(profile, /Account verification was rejected/);
    assert.equal((profile.match(/Submit Again/g) ?? []).length, 1);
    assert.equal((profile.match(/submitVerificationAgain/g) ?? []).length, 2);
    assert.match(profile, /Complete Profile/);
    assert.match(profile, /onClick=\{\(\) => openEditor\("company"\)\}/);
    assert.match(profile, /profile-section-company/);
    assert.match(profile, /Resubmit verification/);
    assert.match(profile, /resubmitEmployerVerification/);
    assert.match(profile, /EmployerVerificationReviewBanner/);
    assert.equal(profile.includes("verificationStatus = \"pending\""), false);
    assert.equal(profile.includes("verificationStatus = \"rejected\""), false);
  });

  it("edits profile details and re-uploads documents through the existing APIs", () => {
    const profile = readSource(
      "../components/employer-profile/EmployerProfilePageContent.tsx",
    );
    const documents = readSource(
      "../components/employer-profile/EmployerProfileDocumentsSection.tsx",
    );
    const service = readSource("../services/employer-profile.service.ts");
    assert.match(profile, /updateEmployerProfile/);
    assert.match(profile, /openEditor/);
    assert.match(documents, /reuploadEmployerDocument/);
    assert.match(documents, /uploadEmployerDocument/);
    assert.match(service, /\/employers\/me\/verification\/resubmit/);
    assert.match(service, /reupload/);
  });
});
