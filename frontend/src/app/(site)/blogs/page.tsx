import { BlogListingPage } from "@/components/blogs/BlogListingPage";
import { listingMetadata } from "@/utils/seo/blog-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = listingMetadata();

export default function BlogsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted">Loading articles…</div>}>
      <BlogListingPage />
    </Suspense>
  );
}
