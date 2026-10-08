export type InAppBrowserPlatform = "android" | "ios" | "other";

export type InAppBrowserDetection = {
  isInApp: boolean;
  isWhatsApp: boolean;
  platform: InAppBrowserPlatform;
};

const WHATSAPP_UA = /whatsapp|\bwa\//i;
const FACEBOOK_UA = /fban|fbav|fb_iab|fb4a|fbios/i;
const INSTAGRAM_UA = /instagram/i;
const LINE_UA = /\bline\//i;
const TWITTER_UA = /\btwitter/i;
const ANDROID_WEBVIEW_UA = /; wv\)/i;
const IOS_DEVICE_UA = /iphone|ipad|ipod/i;
const ANDROID_DEVICE_UA = /android/i;
const IOS_SAFARI_UA = /safari/i;
const IOS_THIRD_PARTY_BROWSER_UA = /crios|fxios|edgios/i;

/**
 * Detects WhatsApp and other common in-app browsers from a user-agent string.
 * Chrome, Safari, and Edge (including mobile Chrome without `; wv)`) are not treated as in-app.
 */
export function detectInAppBrowser(userAgent: string): InAppBrowserDetection {
  const ua = userAgent.trim();
  const platform: InAppBrowserPlatform = IOS_DEVICE_UA.test(ua)
    ? "ios"
    : ANDROID_DEVICE_UA.test(ua)
      ? "android"
      : "other";

  const isWhatsApp = WHATSAPP_UA.test(ua);
  const isNamedInApp =
    isWhatsApp ||
    FACEBOOK_UA.test(ua) ||
    INSTAGRAM_UA.test(ua) ||
    LINE_UA.test(ua) ||
    TWITTER_UA.test(ua);

  const isAndroidWebView = platform === "android" && ANDROID_WEBVIEW_UA.test(ua);

  /**
   * iOS WKWebView in-app browsers often omit the Safari token.
   * Do not use this alone for desktop or third-party iOS browsers.
   */
  const isIosInAppWebView =
    platform === "ios" &&
    /applewebkit/i.test(ua) &&
    !IOS_SAFARI_UA.test(ua) &&
    !IOS_THIRD_PARTY_BROWSER_UA.test(ua);

  return {
    isInApp: isNamedInApp || isAndroidWebView || isIosInAppWebView,
    isWhatsApp,
    platform,
  };
}

export function shouldShowInAppBrowserHandoff(userAgent: string): boolean {
  return detectInAppBrowser(userAgent).isInApp;
}

/**
 * Same-origin page URL for handoff. Omits the hash so fragments cannot leak.
 */
export function getSameOriginHandoffUrl(location: {
  origin: string;
  pathname: string;
  search: string;
}): string {
  const origin = location.origin.trim();
  const pathname = location.pathname.startsWith("/")
    ? location.pathname
    : `/${location.pathname}`;
  const search = location.search.startsWith("?")
    ? location.search
    : location.search
      ? `?${location.search}`
      : "";

  return `${origin}${pathname}${search}`;
}

function isHttpOrHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/**
 * Best-effort external-browser URL. Websites cannot reliably force Chrome.
 * Android Chrome intent and iOS x-safari schemes are used where they exist;
 * callers must still show manual fallback instructions.
 */
export function getExternalBrowserHandoffHref(
  pageUrl: string,
  platform: InAppBrowserPlatform,
): string {
  const url = isHttpOrHttpsUrl(pageUrl);
  if (!url) {
    return pageUrl;
  }

  const hostAndPath = `${url.host}${url.pathname}${url.search}`;

  if (platform === "android") {
    const scheme = url.protocol.replace(":", "");
    const fallback = encodeURIComponent(url.toString());
    return `intent://${hostAndPath}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
  }

  if (platform === "ios") {
    if (url.protocol === "https:") {
      return `x-safari-https://${hostAndPath}`;
    }
    return `x-safari-http://${hostAndPath}`;
  }

  return url.toString();
}
