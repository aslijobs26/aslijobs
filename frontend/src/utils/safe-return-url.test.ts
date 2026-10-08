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

describe("getSafeReturnUrl", () => {
  it("C: allows the internal company-profile path", () => {
    assert.equal(
      getSafeReturnUrl("/employer/company-profile"),
      "/employer/company-profile",
    );
    assert.equal(
      getSafeReturnUrl("/employer/company-profile?tab=documents"),
      "/employer/company-profile?tab=documents",
    );
  });

  it("E: rejects external and protocol-relative return URLs", () => {
    assert.equal(getSafeReturnUrl("https://evil.example/phish"), null);
    assert.equal(getSafeReturnUrl("//evil.example/phish"), null);
    assert.equal(getSafeReturnUrl("https://www.aslijobs.com/employer/company-profile"), null);
    assert.equal(getSafeReturnUrl("javascript:alert(1)"), null);
    assert.equal(getSafeReturnUrl("/http://evil.example"), null);
  });

  it("rejects empty and malformed candidates", () => {
    assert.equal(getSafeReturnUrl(null), null);
    assert.equal(getSafeReturnUrl(""), null);
    assert.equal(getSafeReturnUrl("employer/company-profile"), null);
  });
});

describe("resolveEmployerPostLoginPath", () => {
  it("TEST H: Complete Your Profile login redirects to /employer/company-profile", () => {
    assert.equal(
      resolveEmployerPostLoginPath("/employer/company-profile"),
      ROUTES.EMPLOYER_COMPANY_PROFILE,
    );
  });

  it("C: returns company-profile when that was the original request", () => {
    assert.equal(
      resolveEmployerPostLoginPath("/employer/company-profile"),
      ROUTES.EMPLOYER_COMPANY_PROFILE,
    );
  });

  it("TEST I: normal login without returnUrl keeps the dashboard home", () => {
    assert.equal(resolveEmployerPostLoginPath(null), ROUTES.EMPLOYER_DASHBOARD);
  });

  it("D: keeps the existing dashboard home when there is no return URL", () => {
    assert.equal(resolveEmployerPostLoginPath(null), ROUTES.EMPLOYER_DASHBOARD);
    assert.equal(resolveEmployerPostLoginPath(""), ROUTES.EMPLOYER_DASHBOARD);
  });

  it("TEST J: external returnUrl is rejected and the dashboard default is used", () => {
    assert.equal(
      resolveEmployerPostLoginPath("https://evil.example"),
      ROUTES.EMPLOYER_DASHBOARD,
    );
  });

  it("E: uses the safe default for an invalid external return URL", () => {
    assert.equal(
      resolveEmployerPostLoginPath("https://evil.example"),
      ROUTES.EMPLOYER_DASHBOARD,
    );
    assert.equal(
      resolveEmployerPostLoginPath("//evil.example"),
      ROUTES.EMPLOYER_DASHBOARD,
    );
  });
});

describe("buildEmployerLoginHref", () => {
  it("preserves company-profile as a login returnUrl", () => {
    assert.equal(
      buildEmployerLoginHref("/employer/company-profile"),
      "/employer/login?returnUrl=%2Femployer%2Fcompany-profile",
    );
  });

  it("omits returnUrl when the candidate is unsafe", () => {
    assert.equal(
      buildEmployerLoginHref("https://evil.example"),
      ROUTES.EMPLOYER_LOGIN,
    );
  });
});

describe("employer login wiring", () => {
  it("C: OTP success uses the safe return path instead of a hardcoded dashboard", () => {
    const source = readFileSync(
      fileURLToPath(
        new URL(
          "../components/employer-login/EmployerLoginForm.tsx",
          import.meta.url,
        ),
      ),
      "utf8",
    );

    assert.match(source, /resolveEmployerPostLoginPath/);
    assert.match(source, /EMPLOYER_LOGIN_RETURN_URL_QUERY/);
    assert.doesNotMatch(source, /router\.replace\(ROUTES\.EMPLOYER_DASHBOARD\)/);
  });

  it("C: the company-profile auth guard still passes the current path to login", () => {
    const source = readFileSync(
      fileURLToPath(
        new URL(
          "../components/employer-dashboard/EmployerAuthGuard.tsx",
          import.meta.url,
        ),
      ),
      "utf8",
    );

    assert.match(source, /buildEmployerLoginHref\(returnUrl/);
  });
});
