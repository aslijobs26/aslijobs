import { getSiteUrl } from "@/constants/site-url";
import { PRIVATE_CRAWL_PATHS } from "@/utils/sitemap/sitemap-entries";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_CRAWL_PATHS],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
