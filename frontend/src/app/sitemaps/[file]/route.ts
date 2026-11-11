import { getSiteUrl } from "@/constants/site-url";
import { fetchSitemapJobsPage } from "@/services/sitemap-jobs.service";
import {
  buildJobEntries,
  buildPublicPageEntries,
  parseSitemapFile,
} from "@/utils/sitemap/sitemap-entries";
import {
  logSitemapFailure,
  sitemapNotFoundResponse,
  sitemapUnavailableResponse,
  sitemapXmlResponse,
} from "@/utils/sitemap/sitemap-response";
import { buildUrlsetXml } from "@/utils/sitemap/sitemap-xml";

// Child sitemaps listed by /sitemap.xml once public URLs exceed one file.
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  const sitemapFile = parseSitemapFile((await params).file);
  if (!sitemapFile) {
    return sitemapNotFoundResponse();
  }

  const siteUrl = getSiteUrl();

  if (sitemapFile.kind === "pages") {
    return sitemapXmlResponse(buildUrlsetXml(buildPublicPageEntries(siteUrl)));
  }

  try {
    const jobsPage = await fetchSitemapJobsPage(sitemapFile.page);
    const jobEntries = buildJobEntries(siteUrl, jobsPage.jobs);

    if (jobEntries.length === 0) {
      return sitemapNotFoundResponse();
    }

    return sitemapXmlResponse(buildUrlsetXml(jobEntries));
  } catch (error) {
    logSitemapFailure(`jobs sitemap page ${sitemapFile.page} unavailable`, error);
    return sitemapUnavailableResponse();
  }
}
