import { getSiteUrl } from "@/constants/site-url";
import type { BlogArticle } from "@/services/blogs.service";
import type { Metadata } from "next";

export function buildBlogMetadata(article: BlogArticle, siteUrl: string): Metadata {
  const canonical = article.seo.canonicalUrl || `${siteUrl}/blogs/${article.slug}`;
  const image = article.seo.ogImageUrl || article.coverImageUrl;
  return {
    title: `${article.seo.title || article.title} | AsliJobs`,
    description: article.seo.description || article.excerpt,
    keywords: article.seo.keywords,
    alternates: { canonical },
    robots: article.allowIndexing ? undefined : { index: false, follow: true },
    openGraph: {
      type: "article",
      title: article.seo.ogTitle || article.title,
      description: article.seo.ogDescription || article.excerpt,
      url: canonical,
      images: image ? [{ url: image, alt: article.coverImageAlt || article.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seo.ogTitle || article.title,
      description: article.seo.ogDescription || article.excerpt,
      images: image ? [image] : undefined,
    },
  };
}

export function buildBlogJsonLd(article: BlogArticle, siteUrl: string): string {
  const url = `${siteUrl}/blogs/${article.slug}`;
  const faqs = article.faqs ?? [];
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        author: { "@type": "Person", name: article.authorName },
        image: article.coverImageUrl ? [article.coverImageUrl] : undefined,
        mainEntityOfPage: url,
        publisher: {
          "@type": "Organization",
          name: "AsliJobs",
          url: siteUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blogs", item: `${siteUrl}/blogs` },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
      ...(faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]
        : []),
    ],
  };
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

export function listingMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  return {
    title: "Career Insights & Hiring Resources | AsliJobs",
    description:
      "Explore expert career advice, job search strategies, hiring insights, workplace trends, and resources to help you grow your career.",
    alternates: { canonical: `${siteUrl}/blogs` },
  };
}
