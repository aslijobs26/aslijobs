import { getSiteUrl } from "@/constants/site-url";
import { fetchSitemapJobsPage } from "@/services/sitemap-jobs.service";
import {
  buildJobEntries,
  buildPublicPageEntries,
  buildSitemapIndexEntries,
  needsSitemapIndex,
} from "@/utils/sitemap/sitemap-entries";
import {
  logSitemapFailure,
  sitemapXmlResponse,
} from "@/utils/sitemap/sitemap-response";
import {
  buildSitemapIndexXml,
  buildUrlsetXml,
} from "@/utils/sitemap/sitemap-xml";

// Rendered per request (never at build time); backend data is cached by the
// fetch in fetchSitemapJobsPage and the response by the CDN.
export const revalidate = 0;

export async function GET(): Promise<Response> {
  const siteUrl = getSiteUrl();
  const pageEntries = buildPublicPageEntries(siteUrl);

  try {
    const firstJobsPage = await fetchSitemapJobsPage(1);

    if (needsSitemapIndex(firstJobsPage)) {
      return sitemapXmlResponse(
        buildSitemapIndexXml(
          buildSitemapIndexEntries(siteUrl, firstJobsPage.totalPages),
        ),
      );
    }

    return sitemapXmlResponse(
      buildUrlsetXml([
        ...pageEntries,
        ...buildJobEntries(siteUrl, firstJobsPage.jobs),
      ]),
    );
  } catch (error) {
    logSitemapFailure("public jobs unavailable, serving public pages only", error);
    return sitemapXmlResponse(buildUrlsetXml(pageEntries), { degraded: true });
  }
}
