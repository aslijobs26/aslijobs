import { BlogHtml } from "@/components/blogs/BlogHtml";
import { BlogShareBar } from "@/components/blogs/BlogShareBar";
import { Container } from "@/components/layout/Container";
import { ROUTES } from "@/constants/routes";
import type { BlogArticle, BlogCard } from "@/services/blogs.service";
import { formatBlogDate, formatReadingTime } from "@/utils/blog-format";
import { Calendar, ChevronDown, ChevronLeft, Clock3 } from "lucide-react";
import Link from "next/link";

export function BlogArticleView({
  article,
  related,
  popular,
}: {
  article: BlogArticle;
  related: BlogCard[];
  popular: BlogCard[];
}) {
  const published = article.publishedAt ? formatBlogDate(article.publishedAt) : "";
  const context = article.headings.some((heading) => heading.level === 2)
    ? article.headings.filter((heading) => heading.level === 2)
    : article.headings;
  const initial = (article.authorName.trim().charAt(0) || "A").toUpperCase();

  return (
    <Container className="py-8 sm:py-10">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="min-w-0">
          <nav className="text-[13px] text-muted">
            <Link href={ROUTES.BLOGS} className="hover:text-primary">
              Career Insights
            </Link>
            {article.category ? (
              <>
                <span className="mx-1.5 text-border" aria-hidden="true">
                  /
                </span>
                <Link href={`${ROUTES.BLOGS}?category=${article.category.slug}`} className="hover:text-primary">
                  {article.category.name}
                </Link>
              </>
            ) : null}
          </nav>

          <header className="mt-4">
            <h1 className="max-w-[46rem] text-[1.85rem] font-bold leading-[1.15] tracking-[-0.03em] text-foreground sm:text-[2.35rem]">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-3 max-w-[46rem] text-[15px] leading-relaxed text-muted sm:text-base">{article.excerpt}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-white px-3 py-1.5 text-[13px] text-muted">
                  <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {formatReadingTime(article.readingTimeMinutes)}
                </span>
                {published ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-white px-3 py-1.5 text-[13px] text-muted">
                    <Calendar className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <time dateTime={article.publishedAt ?? undefined}>{published}</time>
                  </span>
                ) : null}
              </div>
              <BlogShareBar article={article} />
            </div>
          </header>

          {article.coverImageUrl ? (
            <img
              src={article.coverImageUrl}
              alt={article.coverImageAlt || article.title}
              className="mt-5 aspect-[16/8] w-full rounded-2xl object-cover"
            />
          ) : null}

          <div className="w-full">
            <BlogHtml html={article.content} />
            <ArticleFaqs faqs={article.faqs ?? []} />

            <div className="mt-10 rounded-xl border border-primary/15 bg-gradient-to-r from-primary-light to-white px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Written by</p>
              <div className="mt-2.5 flex items-center gap-3">
                {article.authorImageUrl ? (
                  <img src={article.authorImageUrl} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {initial}
                  </span>
                )}
                <p className="font-semibold text-foreground">{article.authorName || "AsliJobs"}</p>
              </div>
            </div>
          </div>
        </article>

        <aside className="grid gap-5 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border-subtle bg-white p-5 text-center shadow-sm">
            <p className="text-base font-bold text-foreground">Find jobs on WhatsApp</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">Browse verified openings and apply in a few taps.</p>
            <Link
              href={ROUTES.FIND_JOBS}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Find jobs
            </Link>
          </div>

          {context.length > 0 ? (
            <nav aria-label="Article context">
              <h2 className="text-sm font-bold text-foreground">Article context</h2>
              <ul className="mt-3 space-y-2.5 border-t border-border-subtle pt-3">
                {context.map((heading) => (
                  <li key={heading.id} className="flex gap-2 text-sm leading-snug text-foreground/80">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <a href={`#${heading.id}`} className="hover:text-primary">
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {popular.length > 0 ? (
            <div>
              <h2 className="text-sm font-bold text-foreground">Popular articles</h2>
              <ul className="mt-3 grid gap-2.5">
                {popular.slice(0, 5).map((blog) => (
                  <li key={blog.id}>
                    <Link
                      href={ROUTES.blog(blog.slug)}
                      className="group flex items-center gap-3 rounded-lg bg-gradient-to-r from-primary-light to-white p-2 shadow-sm ring-1 ring-primary/10 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="size-16 shrink-0 overflow-hidden rounded-md bg-primary-light">
                        {blog.coverImageUrl ? (
                          <img src={blog.coverImageUrl} alt="" className="size-full object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 py-0.5 pr-1">
                        {blog.category ? (
                          <span className="block text-[11px] font-semibold leading-tight text-primary">{blog.category.name}</span>
                        ) : null}
                        <span className="mt-0.5 line-clamp-2 block text-[13px] font-bold leading-snug text-foreground">
                          {blog.title}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted">{formatReadingTime(blog.readingTimeMinutes)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-lg font-bold text-foreground">Recent articles</h2>
          <div className="mt-4 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((blog) => (
              <Link
                key={blog.id}
                href={ROUTES.blog(blog.slug)}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e4ebe8] bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className="block aspect-[16/10] overflow-hidden bg-primary-light">
                  {blog.coverImageUrl ? (
                    <img
                      src={blog.coverImageUrl}
                      alt={blog.coverImageAlt || blog.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </span>
                <span className="flex flex-1 flex-col p-4">
                  {blog.category ? (
                    <span className="text-xs font-semibold text-primary">{blog.category.name}</span>
                  ) : null}
                  <span className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-foreground group-hover:text-primary">
                    {blog.title}
                  </span>
                  {blog.excerpt ? (
                    <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{blog.excerpt}</span>
                  ) : null}
                  <span className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-muted">
                    <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    {formatReadingTime(blog.readingTimeMinutes)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Link
        href={ROUTES.BLOGS}
        className="mt-8 inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#e4ebe8] bg-white px-4 text-sm font-semibold text-foreground shadow-sm hover:border-primary/30 hover:text-primary"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to all blogs
      </Link>
    </Container>
  );
}

function ArticleFaqs({ faqs }: { faqs: { question: string; answer: string }[] }) {
  if (faqs.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border-subtle pt-8" aria-labelledby="article-faq-heading">
      <h2 id="article-faq-heading" className="text-xl font-bold tracking-[-0.02em] text-foreground">
        Frequently Asked Questions
      </h2>
      <div className="mt-1">
        {faqs.map((item, index) => (
          <details key={item.question} className="group border-b border-border-subtle">
            <summary className="flex cursor-pointer list-none items-center gap-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="w-7 shrink-0 text-sm font-bold tabular-nums text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-foreground group-open:text-primary">
                {item.question.replace(/^\s*\d+\.\s*/, "")}
              </span>
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border-subtle text-muted transition-colors group-open:border-primary group-open:bg-primary group-open:text-white">
                <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </span>
            </summary>
            <p className="max-w-[40rem] pb-4 pl-11 pr-11 text-sm leading-7 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
