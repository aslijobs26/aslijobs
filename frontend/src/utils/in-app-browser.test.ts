import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  detectInAppBrowser,
  getExternalBrowserHandoffHref,
  getSameOriginHandoffUrl,
  shouldShowInAppBrowserHandoff,
} from "./in-app-browser";

const WHATSAPP_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.43 Mobile Safari/537.36 WhatsApp/2.24.1.78";
const WHATSAPP_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/24.1.78";
const CHROME_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36";
const CHROME_DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const EDGE_DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
const SAFARI_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
const SAFARI_MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
const FACEBOOK_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.43 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/10.0.0.1.0;]";
const ANDROID_WEBVIEW_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.43 Mobile Safari/537.36";
const IOS_WKWEBVIEW_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

describe("detectInAppBrowser", () => {
  it("A: detects WhatsApp Android in-app browser", () => {
    const result = detectInAppBrowser(WHATSAPP_ANDROID_UA);
    assert.equal(result.isInApp, true);
    assert.equal(result.isWhatsApp, true);
    assert.equal(result.platform, "android");
    assert.equal(shouldShowInAppBrowserHandoff(WHATSAPP_ANDROID_UA), true);
  });

  it("A: detects WhatsApp iOS in-app browser", () => {
    const result = detectInAppBrowser(WHATSAPP_IOS_UA);
    assert.equal(result.isInApp, true);
    assert.equal(result.isWhatsApp, true);
    assert.equal(result.platform, "ios");
  });

  it("B: does not show handoff in mobile Chrome", () => {
    const result = detectInAppBrowser(CHROME_ANDROID_UA);
    assert.equal(result.isInApp, false);
    assert.equal(result.isWhatsApp, false);
    assert.equal(shouldShowInAppBrowserHandoff(CHROME_ANDROID_UA), false);
  });

  it("F: does not show WhatsApp-specific UI in desktop Chrome, Edge, or Safari", () => {
    assert.equal(detectInAppBrowser(CHROME_DESKTOP_UA).isInApp, false);
    assert.equal(detectInAppBrowser(EDGE_DESKTOP_UA).isInApp, false);
    assert.equal(detectInAppBrowser(SAFARI_MAC_UA).isInApp, false);
    assert.equal(detectInAppBrowser(SAFARI_IOS_UA).isInApp, false);
  });

  it("detects other common in-app browsers and Android WebView", () => {
    assert.equal(detectInAppBrowser(FACEBOOK_ANDROID_UA).isInApp, true);
    assert.equal(detectInAppBrowser(ANDROID_WEBVIEW_UA).isInApp, true);
    assert.equal(detectInAppBrowser(IOS_WKWEBVIEW_UA).isInApp, true);
  });
});

describe("external browser handoff URLs", () => {
  const companyProfileUrl =
    "https://www.aslijobs.com/employer/company-profile";

  it("G: Android uses a Chrome intent and keeps a https fallback", () => {
    const href = getExternalBrowserHandoffHref(companyProfileUrl, "android");
    assert.match(href, /^intent:\/\/www\.aslijobs\.com\/employer\/company-profile/);
    assert.match(href, /package=com\.android\.chrome/);
    assert.match(
      href,
      /S\.browser_fallback_url=https%3A%2F%2Fwww\.aslijobs\.com%2Femployer%2Fcompany-profile/,
    );
  });

  it("G: iOS uses x-safari-https rather than failing silently", () => {
    assert.equal(
      getExternalBrowserHandoffHref(companyProfileUrl, "ios"),
      "x-safari-https://www.aslijobs.com/employer/company-profile",
    );
  });

  it("omits the URL hash from the same-origin handoff URL", () => {
    assert.equal(
      getSameOriginHandoffUrl({
        origin: "https://www.aslijobs.com",
        pathname: "/employer/company-profile",
        search: "",
      }),
      companyProfileUrl,
    );
    assert.equal(
      getSameOriginHandoffUrl({
        origin: "https://www.aslijobs.com",
        pathname: "/employer/login",
        search: "?returnUrl=%2Femployer%2Fcompany-profile",
      }),
      "https://www.aslijobs.com/employer/login?returnUrl=%2Femployer%2Fcompany-profile",
    );
  });

  it("does not build intent URLs for non-http schemes", () => {
    assert.equal(
      getExternalBrowserHandoffHref("javascript:alert(1)", "android"),
      "javascript:alert(1)",
    );
  });
});

describe("WhatsApp company-profile wiring", () => {
  it("A: company-profile auth guard shows the in-app handoff instead of login", () => {
    const source = readFileSync(
      fileURLToPath(
        new URL(
          "../components/employer-dashboard/EmployerAuthGuard.tsx",
          import.meta.url,
        ),
      ),
      "utf8",
    );

    assert.match(source, /detectInAppBrowser\(navigator\.userAgent\)/);
    assert.match(source, /in_app_handoff/);
    assert.match(source, /InAppBrowserHandoff/);
  });

  it("A: employer login replaces the OTP form with the handoff gate", () => {
    const source = readFileSync(
      fileURLToPath(
        new URL(
          "../components/employer-login/EmployerLoginContent.tsx",
          import.meta.url,
        ),
      ),
      "utf8",
    );

    assert.match(source, /InAppBrowserHandoffGate/);
    assert.match(source, /EmployerLoginForm/);
  });

  it("G: handoff UI always includes the WhatsApp Open in browser fallback", () => {
    const source = readFileSync(
      fileURLToPath(
        new URL(
          "../components/in-app-browser/InAppBrowserHandoff.tsx",
          import.meta.url,
        ),
      ),
      "utf8",
    );

    assert.match(source, /auth\.inAppBrowser\.fallback/);
    assert.match(source, /auth\.inAppBrowser\.fallbackIos/);
    assert.match(source, /getExternalBrowserHandoffHref/);
  });
});
