import { BlogArticleView } from "@/components/blogs/BlogArticleView";
import { BlogNotFoundError, fetchBlogPreview } from "@/services/blogs.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PreviewPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { token } = await params;
  try {
    const preview = await fetchBlogPreview(token);
    return {
      title: `${preview.article.title} | AsliJobs`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Article preview | AsliJobs", robots: { index: false, follow: false } };
  }
}

export default async function BlogPreviewPage({ params }: PreviewPageProps) {
  const { token } = await params;
  try {
    const preview = await fetchBlogPreview(token);
    const related = preview.related.length > 0 ? preview.related : preview.popular;
    const label =
      preview.status === "scheduled"
        ? "Scheduled preview. This article is not live on the website yet."
        : "Draft preview. This article is not published.";
    return (
      <>
        {preview.status === "published" ? null : (
          <p className="border-b border-[#f3e2b8] bg-[#fff8ea] px-4 py-2 text-center text-xs font-semibold text-[#8a5a12]">
            {label}
          </p>
        )}
        <BlogArticleView article={preview.article} related={related} popular={preview.popular} />
      </>
    );
  } catch (error) {
    if (error instanceof BlogNotFoundError) notFound();
    throw error;
  }
}
