/**
 * Optional browser-rendered HTML fallback for thin Next.js shells.
 * Disabled by default. Never used on the WhatsApp webhook path.
 */
import {
  assertPublicKnowledgeUrl,
  assertResolvedAddressPublic,
  type AllowedFetchOrigin,
} from "./website-knowledge.ssrf.js";
import { isCrawlablePublicPath, normalizeKnowledgePath } from "./website-knowledge.discover.js";
import { extractKnowledgeFromHtml } from "./website-knowledge.html.js";

export type BrowserFetchResult = {
  ok: boolean;
  html: string;
  error?: string;
  durationMs?: number;
  consoleErrors?: string[];
};

const THIN_PATHS = new Set(["/resources", "/resources?page=sitemap"]);

/** Max concurrent Chromium instances for knowledge crawl. */
const MAX_BROWSER_CONCURRENCY = 1;
let browserInFlight = 0;
const browserWaiters: Array<() => void> = [];

async function withBrowserSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (browserInFlight >= MAX_BROWSER_CONCURRENCY) {
    await new Promise<void>((resolve) => {
      browserWaiters.push(resolve);
    });
  }
  browserInFlight += 1;
  try {
    return await fn();
  } finally {
    browserInFlight -= 1;
    const next = browserWaiters.shift();
    if (next) next();
  }
}

export function isThinKnowledgePath(path: string): boolean {
  const normalized = normalizeKnowledgePath(path);
  const base = normalized.split("?")[0] || "";
  return THIN_PATHS.has(normalized) || THIN_PATHS.has(base) || base === "/resources";
}

export function shouldAttemptBrowserFallback(input: {
  enabled: boolean;
  path: string;
  contentChars: number;
  minChars?: number;
}): boolean {
  if (!input.enabled) return false;
  const min = input.minChars ?? 120;
  if (isThinKnowledgePath(input.path)) return true;
  return input.contentChars < min;
}

export function classifyContentQuality(contentChars: number): "rich" | "adequate" | "thin" | "empty" {
  if (contentChars <= 0) return "empty";
  if (contentChars < 80) return "thin";
  if (contentChars < 400) return "adequate";
  return "rich";
}

type PlaywrightChromium = {
  launch: (options: Record<string, unknown>) => Promise<{
    newContext: (options?: Record<string, unknown>) => Promise<{
      newPage: () => Promise<{
        setDefaultTimeout: (ms: number) => void;
        setDefaultNavigationTimeout: (ms: number) => void;
        goto: (url: string, options: Record<string, unknown>) => Promise<unknown>;
        waitForSelector: (selector: string, options?: Record<string, unknown>) => Promise<unknown>;
        waitForTimeout: (ms: number) => Promise<void>;
        content: () => Promise<string>;
        on: (event: string, handler: (...args: unknown[]) => void) => void;
        close: () => Promise<void>;
      }>;
      close: () => Promise<void>;
    }>;
    close: () => Promise<void>;
  }>;
};

async function loadPlaywrightChromium(): Promise<PlaywrightChromium | null> {
  try {
    const importer = new Function("specifier", "return import(specifier)") as (
      specifier: string,
    ) => Promise<{ chromium?: PlaywrightChromium }>;
    const playwright = await importer("playwright").catch(() => null);
    return playwright?.chromium ?? null;
  } catch {
    return null;
  }
}

export async function fetchKnowledgeHtmlWithBrowser(input: {
  absoluteUrl: string;
  allowed: AllowedFetchOrigin[];
  timeoutMs?: number;
}): Promise<BrowserFetchResult> {
  const timeoutMs = Math.min(Math.max(input.timeoutMs ?? 20_000, 5_000), 60_000);
  const started = Date.now();
  let current: URL;
  try {
    current = assertPublicKnowledgeUrl(input.absoluteUrl, input.allowed);
  } catch (error) {
    return {
      ok: false,
      html: "",
      error: error instanceof Error ? error.message : "url_blocked",
      durationMs: Date.now() - started,
    };
  }
  const path = normalizeKnowledgePath(current.pathname + current.search);
  if (!isCrawlablePublicPath(path)) {
    return { ok: false, html: "", error: "path_not_allowlisted", durationMs: Date.now() - started };
  }
  try {
    await assertResolvedAddressPublic(current.hostname, input.allowed);
  } catch (error) {
    return {
      ok: false,
      html: "",
      error: error instanceof Error ? error.message : "dns_blocked",
      durationMs: Date.now() - started,
    };
  }

  return withBrowserSlot(async () => {
    const chromium = await loadPlaywrightChromium();
    if (!chromium) {
      return {
        ok: false,
        html: "",
        error: "playwright_unavailable",
        durationMs: Date.now() - started,
      };
    }

    let browser: Awaited<ReturnType<PlaywrightChromium["launch"]>> | null = null;
    let context: Awaited<ReturnType<Awaited<ReturnType<PlaywrightChromium["launch"]>>["newContext"]>> | null =
      null;
    let page: Awaited<
      ReturnType<
        Awaited<ReturnType<Awaited<ReturnType<PlaywrightChromium["launch"]>>["newContext"]>>["newPage"]
      >
    > | null = null;
    const consoleErrors: string[] = [];

    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-background-networking",
        ],
      });
      context = await browser.newContext({
        javaScriptEnabled: true,
        ignoreHTTPSErrors: false,
        viewport: { width: 1280, height: 720 },
        userAgent:
          "AsliJobsKnowledgeBot/1.0 (+https://www.aslijobs.com; website-knowledge crawl; contact ops)",
      });
      page = await context.newPage();
      page.setDefaultTimeout(timeoutMs);
      page.setDefaultNavigationTimeout(timeoutMs);
      page.on("console", (...args: unknown[]) => {
        const msg = args[0] as { type?: () => string; text?: () => string } | undefined;
        if (msg?.type?.() === "error") {
          const text = String(msg.text?.() || "").slice(0, 200);
          if (text) consoleErrors.push(text);
        }
      });
      page.on("pageerror", (...args: unknown[]) => {
        const err = args[0];
        const text = err instanceof Error ? err.message : String(err || "");
        if (text) consoleErrors.push(text.slice(0, 200));
      });

      // Prefer DOM ready over networkidle (CSR apps often keep sockets open).
      await page.goto(current.toString(), {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });
      // Give React/Next hydration a bounded window; do not wait forever.
      await Promise.race([
        page.waitForSelector("main, article, h1, h2, a[href]", { timeout: Math.min(4_000, timeoutMs) }),
        page.waitForTimeout(1_200),
      ]).catch(() => undefined);
      await page.waitForTimeout(500);

      const html = await page.content();
      return {
        ok: Boolean(html && html.length > 0),
        html: html || "",
        error: html ? undefined : "empty_html",
        durationMs: Date.now() - started,
        consoleErrors: consoleErrors.slice(0, 8),
      };
    } catch (error) {
      return {
        ok: false,
        html: "",
        error: error instanceof Error ? error.message : "browser_fetch_failed",
        durationMs: Date.now() - started,
        consoleErrors: consoleErrors.slice(0, 8),
      };
    } finally {
      try {
        await page?.close();
      } catch {
        /* ignore */
      }
      try {
        await context?.close();
      } catch {
        /* ignore */
      }
      try {
        await browser?.close();
      } catch {
        /* ignore */
      }
    }
  });
}

export async function extractWithOptionalBrowser(input: {
  absoluteUrl: string;
  allowed: AllowedFetchOrigin[];
  enabled: boolean;
  path: string;
  ssrContentChars: number;
  timeoutMs?: number;
}): Promise<{
  usedBrowser: boolean;
  extracted: ReturnType<typeof extractKnowledgeFromHtml> | null;
  error?: string;
  durationMs?: number;
  consoleErrors?: string[];
  quality?: ReturnType<typeof classifyContentQuality>;
}> {
  if (
    !shouldAttemptBrowserFallback({
      enabled: input.enabled,
      path: input.path,
      contentChars: input.ssrContentChars,
    })
  ) {
    return { usedBrowser: false, extracted: null };
  }
  const browser = await fetchKnowledgeHtmlWithBrowser({
    absoluteUrl: input.absoluteUrl,
    allowed: input.allowed,
    timeoutMs: input.timeoutMs,
  });
  if (!browser.ok) {
    return {
      usedBrowser: true,
      extracted: null,
      error: browser.error,
      durationMs: browser.durationMs,
      consoleErrors: browser.consoleErrors,
    };
  }
  const extracted = extractKnowledgeFromHtml(browser.html, { pageUrl: input.absoluteUrl });
  const chars =
    extracted.sections.reduce((n, s) => n + s.content.length, 0)
    + extracted.faqs.reduce((n, f) => n + f.answer.length, 0)
    + (extracted.plainText?.length || 0);
  return {
    usedBrowser: true,
    extracted,
    durationMs: browser.durationMs,
    consoleErrors: browser.consoleErrors,
    quality: classifyContentQuality(chars),
  };
}
