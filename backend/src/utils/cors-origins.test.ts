import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAllowedCorsOrigins,
  buildDevelopmentCorsPorts,
  isAsliJobsAdminVercelOrigin,
  isCorsOriginAllowed,
  isDevelopmentLanOriginAllowed,
  isPrivateOrLoopbackHostname,
  normalizeOrigin,
  PRODUCTION_ADMIN_ORIGINS,
} from "./cors-origins.js";

describe("cors LAN development helpers", () => {
  it("recognizes private and loopback hostnames", () => {
    assert.equal(isPrivateOrLoopbackHostname("localhost"), true);
    assert.equal(isPrivateOrLoopbackHostname("127.0.0.1"), true);
    assert.equal(isPrivateOrLoopbackHostname("192.168.1.20"), true);
    assert.equal(isPrivateOrLoopbackHostname("10.0.0.8"), true);
    assert.equal(isPrivateOrLoopbackHostname("172.16.4.2"), true);
    assert.equal(isPrivateOrLoopbackHostname("172.32.0.1"), false);
    assert.equal(isPrivateOrLoopbackHostname("aslijobs.com"), false);
  });

  it("allows LAN origins only on configured frontend/admin ports", () => {
    const ports = buildDevelopmentCorsPorts({
      frontendUrl: "http://localhost:3000",
      adminUrl: "http://localhost:5173",
    });

    assert.equal(
      isDevelopmentLanOriginAllowed("http://192.168.1.20:3000", ports),
      true,
    );
    assert.equal(
      isDevelopmentLanOriginAllowed("http://10.0.0.5:5173", ports),
      true,
    );
    assert.equal(
      isDevelopmentLanOriginAllowed("http://192.168.1.20:4000", ports),
      false,
    );
    assert.equal(
      isDevelopmentLanOriginAllowed("https://evil.example:3000", ports),
      false,
    );
  });
});

describe("AsliJobs Admin Vercel origin matcher", () => {
  it("allows the live git-main Admin deployment host", () => {
    assert.equal(
      isAsliJobsAdminVercelOrigin(
        "https://aslijobs-admin-git-main-asli-jobs.vercel.app",
      ),
      true,
    );
  });

  it("allows team production and default Vercel Admin hosts", () => {
    assert.equal(
      isAsliJobsAdminVercelOrigin("https://aslijobs-admin.vercel.app"),
      true,
    );
    assert.equal(
      isAsliJobsAdminVercelOrigin("https://aslijobs-admin-asli-jobs.vercel.app"),
      true,
    );
    assert.equal(
      isAsliJobsAdminVercelOrigin(
        "https://aslijobs-admin-git-feature-x-asli-jobs.vercel.app",
      ),
      true,
    );
  });

  it("rejects other Vercel projects, http, and spoofed hosts", () => {
    assert.equal(
      isAsliJobsAdminVercelOrigin("https://other-project-asli-jobs.vercel.app"),
      false,
    );
    assert.equal(
      isAsliJobsAdminVercelOrigin(
        "https://aslijobs-admin-git-main-other-team.vercel.app",
      ),
      false,
    );
    assert.equal(
      isAsliJobsAdminVercelOrigin(
        "http://aslijobs-admin-git-main-asli-jobs.vercel.app",
      ),
      false,
    );
    assert.equal(
      isAsliJobsAdminVercelOrigin(
        "https://aslijobs-admin.vercel.app.evil.com",
      ),
      false,
    );
  });
});

describe("production Admin CORS allowlist", () => {
  it("always allows Vercel Admin and custom Admin domain", () => {
    const allowed = buildAllowedCorsOrigins({
      frontendUrl: "https://www.aslijobs.com",
      // Only one Admin host configured — both production hosts must still work.
      adminUrl: "https://admin.aslijobs.com",
    });

    assert.equal(
      isCorsOriginAllowed("https://aslijobs-admin.vercel.app", allowed),
      true,
    );
    assert.equal(
      isCorsOriginAllowed("https://admin.aslijobs.com", allowed),
      true,
    );
    assert.equal(
      isCorsOriginAllowed(
        "https://aslijobs-admin-git-main-asli-jobs.vercel.app",
        allowed,
      ),
      true,
    );
    for (const origin of PRODUCTION_ADMIN_ORIGINS) {
      assert.ok(allowed.includes(origin));
    }
  });

  it("allows public website apex and www variants", () => {
    const allowed = buildAllowedCorsOrigins({
      frontendUrl: "https://www.aslijobs.com",
      adminUrl: "https://admin.aslijobs.com",
    });

    assert.equal(isCorsOriginAllowed("https://www.aslijobs.com", allowed), true);
    assert.equal(isCorsOriginAllowed("https://aslijobs.com", allowed), true);
  });

  it("rejects unauthorized origins", () => {
    const allowed = buildAllowedCorsOrigins({
      frontendUrl: "https://www.aslijobs.com",
      adminUrl: "https://admin.aslijobs.com",
      extraOrigins: ["https://staging.aslijobs.com"],
    });

    assert.equal(
      isCorsOriginAllowed("https://malicious-example.com", allowed),
      false,
    );
    assert.equal(
      isCorsOriginAllowed("https://aslijobs-admin.vercel.app.evil.com", allowed),
      false,
    );
    assert.equal(
      isCorsOriginAllowed("https://admin.aslijobs.com/", allowed),
      false,
    );
  });

  it("strips trailing slashes from configured origins", () => {
    assert.equal(
      normalizeOrigin("https://admin.aslijobs.com/"),
      "https://admin.aslijobs.com",
    );

    const allowed = buildAllowedCorsOrigins({
      frontendUrl: "https://www.aslijobs.com/",
      adminUrl: "https://admin.aslijobs.com/",
      extraOrigins: ["https://preview.example.com/"],
    });

    assert.equal(isCorsOriginAllowed("https://admin.aslijobs.com", allowed), true);
    assert.equal(
      isCorsOriginAllowed("https://preview.example.com", allowed),
      true,
    );
  });

  it("allows requests with no Origin (non-browser clients)", () => {
    const allowed = buildAllowedCorsOrigins({
      frontendUrl: "https://www.aslijobs.com",
      adminUrl: "https://admin.aslijobs.com",
    });
    assert.equal(isCorsOriginAllowed(undefined, allowed), true);
  });

  it("merges CORS_ALLOWED_ORIGINS extras without dropping production Admin hosts", () => {
    const allowed = buildAllowedCorsOrigins({
      frontendUrl: "http://localhost:3000",
      adminUrl: "http://localhost:5173",
      extraOrigins: ["https://staging.aslijobs.com"],
    });

    assert.equal(
      isCorsOriginAllowed("https://staging.aslijobs.com", allowed),
      true,
    );
    assert.equal(
      isCorsOriginAllowed("https://aslijobs-admin.vercel.app", allowed),
      true,
    );
    assert.equal(
      isCorsOriginAllowed("https://admin.aslijobs.com", allowed),
      true,
    );
  });
});
