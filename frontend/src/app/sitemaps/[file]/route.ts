import { getSiteUrl } from "@/constants/site-url";
import { fetchBlogSitemap } from "@/services/blogs.service";
import { fetchSitemapJobsPage } from "@/services/sitemap-jobs.service";
import {
  buildBlogEntries,
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
    let blogEntries: ReturnType<typeof buildBlogEntries> = [];
    try {
      const blogs = await fetchBlogSitemap();
      blogEntries = buildBlogEntries(
        siteUrl,
        blogs.map((blog) => ({ slug: blog.slug, lastModified: blog.updatedAt })),
      );
    } catch (error) {
      logSitemapFailure("public blogs unavailable for pages sitemap", error);
    }
    return sitemapXmlResponse(
      buildUrlsetXml([...buildPublicPageEntries(siteUrl), ...blogEntries]),
    );
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
