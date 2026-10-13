import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_LANGUAGE_STORAGE_KEY } from "../constants/site-language";
import { translate } from "./translate";
import {
  isEmployerDashboardInterfacePath,
  resolveInterfaceSiteLanguage,
} from "./employer-interface-language";
import { getSiteLanguageCode, readSiteLanguage, writeSiteLanguage } from "./site-language";

const here = dirname(fileURLToPath(import.meta.url));

const DASHBOARD_PATHS = [
  "/employer/dashboard",
  "/employer/jobs",
  "/employer/jobs/64f0000000000000000000aa/under-review",
  "/employer/candidates",
  "/employer/candidates/64f0000000000000000000aa",
  "/employer/interviews",
  "/employer/messages",
  "/employer/saved-candidates",
  "/employer/company-profile",
  "/employer/settings",
  "/employer/help-center",
  "/employer/notifications",
  "/employer/subscription",
  "/employer/team-management",
  "/employer/unauthorized",
  "/post-job",
  "/post-job/64f0000000000000000000aa",
  "/post-job/success",
] as const;

const PUBLIC_PATHS = [
  "/",
  "/jobs",
  "/jobs/AJ-2026-000001",
  "/employer/login",
  "/employer/register",
  "/employer/member-login",
  "/job-seeker/login",
  "/job-seeker/register",
  "/post-a-job",
  "/faqs",
] as const;

const PUBLIC_LANGUAGES = [
  { value: "telugu", code: "te" as const, label: "తెలుగు" },
  { value: "hindi", code: "hi" as const, label: "हिंदी" },
  { value: "tamil", code: "ta" as const, label: "தமிழ்" },
  { value: "kannada", code: "kn" as const, label: "ಕನ್ನಡ" },
  { value: "malayalam", code: "ml" as const, label: "മലയാളം" },
];

function installBrowser(language: string, pathname: string) {
  const values = new Map<string, string>();
  const location = { pathname };
  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
          values.set(key, value);
        },
        removeItem: (key: string) => {
          values.delete(key);
        },
      },
      navigator: { language },
      location,
      dispatchEvent: () => true,
    },
    document: { documentElement: { lang: "en" } },
  });
  return location;
}

describe("employer dashboard language isolation", () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("treats employer workspace and job posting as English-only routes", () => {
    for (const path of DASHBOARD_PATHS) {
      assert.equal(isEmployerDashboardInterfacePath(path), true, path);
    }
    for (const path of PUBLIC_PATHS) {
      assert.equal(isEmployerDashboardInterfacePath(path), false, path);
    }
  });

  it("keeps dashboard copy in English for every public language without changing the saved preference", () => {
    const location = installBrowser("te-IN", "/employer/dashboard");
    for (const language of PUBLIC_LANGUAGES) {
      writeSiteLanguage(language);
      location.pathname = "/employer/dashboard";
      assert.equal(readSiteLanguage().code, language.code);
      assert.equal(getSiteLanguageCode(), "en");
      assert.equal(
        translate(
          resolveInterfaceSiteLanguage("/employer/dashboard", readSiteLanguage()).code,
          "employer.nav.dashboard",
        ),
        "Dashboard",
      );
      assert.notEqual(
        translate(language.code, "employer.nav.dashboard"),
        "Dashboard",
      );
      location.pathname = "/jobs";
      assert.equal(getSiteLanguageCode(), language.code);
      assert.equal(readSiteLanguage().code, language.code);
    }
  });

  it("ignores the browser language on dashboard routes and still uses it on the public site", () => {
    const location = installBrowser("ta-IN", "/employer/settings");
    writeSiteLanguage({ value: "english", code: "en", label: "English" });
    window.localStorage.removeItem(SITE_LANGUAGE_STORAGE_KEY);
    assert.equal(readSiteLanguage().code, "ta");
    assert.equal(getSiteLanguageCode(), "en");
    location.pathname = "/";
    assert.equal(getSiteLanguageCode(), "ta");
    assert.equal(readSiteLanguage().code, "ta");
  });

  it("returns to the public language after leaving the dashboard and keeps login multilingual", () => {
    const location = installBrowser("en-US", "/employer/dashboard");
    writeSiteLanguage({ value: "telugu", code: "te", label: "తెలుగు" });
    assert.equal(getSiteLanguageCode(), "en");
    location.pathname = "/employer/login";
    assert.equal(getSiteLanguageCode(), "te");
    assert.equal(
      translate(
        resolveInterfaceSiteLanguage("/employer/login", readSiteLanguage()).code,
        "employer.nav.dashboard",
      ),
      "డాష్‌బోర్డ్",
    );
    location.pathname = "/";
    assert.equal(getSiteLanguageCode(), "te");
    location.pathname = "/employer/dashboard";
    assert.equal(getSiteLanguageCode(), "en");
    assert.equal(window.localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY), "telugu");
  });

  it("removes the language selector from the employer navbar and keeps it on the public navbar", () => {
    const employerNavbar = readFileSync(
      join(here, "../components/employer-dashboard/EmployerNavbar.tsx"),
      "utf8",
    );
    const publicNavbar = readFileSync(
      join(here, "../components/layout/Navbar.tsx"),
      "utf8",
    );
    assert.equal(employerNavbar.includes("NavbarLanguageButton"), false);
    assert.equal(publicNavbar.includes("NavbarLanguageButton"), true);
  });
});
