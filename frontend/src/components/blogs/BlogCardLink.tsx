import type { BlogCard } from "@/services/blogs.service";
import { ROUTES } from "@/constants/routes";
import { formatBlogDate, formatReadingTime } from "@/utils/blog-format";
import { cn } from "@/utils/cn";
import Link from "next/link";

type BlogCardLinkProps = {
  blog: BlogCard;
  size?: "home" | "compact" | "feature";
};

function HomeBlogCard({ blog, published }: { blog: BlogCard; published: string }) {
  return (
    <Link
      href={ROUTES.blog(blog.slug)}
      className="group flex h-full min-w-0 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span className="block aspect-[16/10] overflow-hidden rounded-xl bg-primary-light">
        {blog.coverImageUrl ? (
          <img
            src={blog.coverImageUrl}
            alt={blog.coverImageAlt || blog.title}
            className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </span>
      <span className="mt-3 text-[13px] font-semibold text-primary">
        {formatReadingTime(blog.readingTimeMinutes)}
        {published ? ` • ${published}` : ""}
      </span>
      <span className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-snug text-[#3d4750] group-hover:text-foreground">
        {blog.title}
      </span>
    </Link>
  );
}

export function BlogCardLink({ blog, size = "home" }: BlogCardLinkProps) {
  const feature = size === "feature";
  const published = blog.publishedAt ? formatBlogDate(blog.publishedAt) : "";

  if (size === "home") {
    return <HomeBlogCard blog={blog} published={published} />;
  }

  return (
    <Link
      href={ROUTES.blog(blog.slug)}
      className="group flex h-full min-w-0 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span
        className={cn(
          "relative block overflow-hidden rounded-2xl bg-primary-light",
          feature ? "aspect-[16/10]" : "aspect-[16/10]",
        )}
      >
        {blog.coverImageUrl ? (
          <img
            src={blog.coverImageUrl}
            alt={blog.coverImageAlt || blog.title}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </span>
      <span className="mt-3 flex min-w-0 flex-col gap-1.5">
        <span className="text-xs text-muted">
          {formatReadingTime(blog.readingTimeMinutes)}
          {published ? ` · ${published}` : ""}
        </span>
        {blog.category ? (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {blog.category.name}
          </span>
        ) : null}
        <span
          className={cn(
            "font-bold leading-snug text-foreground group-hover:text-primary",
            feature ? "text-xl sm:text-2xl" : "line-clamp-2 text-sm sm:text-base",
          )}
        >
          {blog.title}
        </span>
        {size !== "home" ? (
          <span className="line-clamp-2 text-sm leading-relaxed text-muted">{blog.excerpt}</span>
        ) : null}
        {feature ? (
          <span className="mt-1 text-sm font-semibold text-primary">Read article</span>
        ) : null}
      </span>
    </Link>
  );
}
