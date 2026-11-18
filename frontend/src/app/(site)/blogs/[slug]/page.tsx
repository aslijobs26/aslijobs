import { BlogArticleView } from "@/components/blogs/BlogArticleView";
import {
  BlogNotFoundError,
  fetchBlogArticle,
  fetchPublishedBlogs,
  fetchRelatedBlogs,
} from "@/services/blogs.service";
import { getSiteUrl } from "@/constants/site-url";
import { buildBlogJsonLd, buildBlogMetadata } from "@/utils/seo/blog-metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await fetchBlogArticle(slug);
    return buildBlogMetadata(article, getSiteUrl());
  } catch (error) {
    if (error instanceof BlogNotFoundError) {
      return { title: "Article not found | AsliJobs", robots: { index: false, follow: false } };
    }
    return { title: "Career insights | AsliJobs" };
  }
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params;
  try {
    const [article, related, published] = await Promise.all([
      fetchBlogArticle(slug),
      fetchRelatedBlogs(slug).catch(() => []),
      fetchPublishedBlogs({ limit: 6 }).catch(() => null),
    ]);
    const others = (published?.items ?? []).filter((item) => item.slug !== slug);
    const jsonLd = buildBlogJsonLd(article, getSiteUrl());
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <BlogArticleView article={article} related={related.length > 0 ? related : others} popular={others} />
      </>
    );
  } catch (error) {
    if (error instanceof BlogNotFoundError) notFound();
    throw error;
  }
}
