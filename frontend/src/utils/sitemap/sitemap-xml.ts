export type SitemapEntry = {
  loc: string;
  lastModified?: string | null;
};

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** W3C Datetime as required by the sitemap protocol, or null when unreliable. */
export function toSitemapLastModified(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function uniqueByLoc(entries: readonly SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.loc)) {
      return false;
    }
    seen.add(entry.loc);
    return true;
  });
}

function renderEntries(
  entries: readonly SitemapEntry[],
  element: "url" | "sitemap",
): string {
  return uniqueByLoc(entries)
    .map((entry) => {
      const lastModified = toSitemapLastModified(entry.lastModified);
      const lastmod = lastModified
        ? `<lastmod>${lastModified}</lastmod>`
        : "";
      return `<${element}><loc>${escapeXml(entry.loc)}</loc>${lastmod}</${element}>`;
    })
    .join("\n");
}

export function buildUrlsetXml(entries: readonly SitemapEntry[]): string {
  return `${XML_DECLARATION}\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${renderEntries(entries, "url")}\n</urlset>\n`;
}

export function buildSitemapIndexXml(entries: readonly SitemapEntry[]): string {
  return `${XML_DECLARATION}\n<sitemapindex xmlns="${SITEMAP_NAMESPACE}">\n${renderEntries(entries, "sitemap")}\n</sitemapindex>\n`;
}
