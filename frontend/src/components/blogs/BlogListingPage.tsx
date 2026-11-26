"use client";

import mechanicImage from "@/assets/blogs/insight-mechanic.png";
import painterImage from "@/assets/blogs/insight-painter.png";
import riderImage from "@/assets/blogs/insight-rider.png";
import cleanerImage from "@/assets/blogs/insight-cleaner.png";
import { Container } from "@/components/layout/Container";
import { SocialIcon } from "@/components/layout/footer/footer-social-icons";
import { SOCIAL_LINKS, type SocialPlatform } from "@/constants/social";
import { ROUTES } from "@/constants/routes";
import {
  fetchBlogCategories,
  fetchBlogsByCategory,
  fetchFeaturedBlog,
  fetchPublishedBlogs,
  type BlogCard,
  type BlogCategory,
} from "@/services/blogs.service";
import { formatReadingTime } from "@/utils/blog-format";
import { cn } from "@/utils/cn";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Mail, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const SECTION_GROUPS = [
  { title: "Job Search & Career Guidance", slugs: ["job-search", "career-guidance"] },
  { title: "Hiring & Recruitment", slugs: ["hiring-recruitment"] },
  { title: "Interview Preparation", slugs: ["interview-preparation"] },
  { title: "Skills & Training", slugs: ["skills-training"] },
] as const;

const SIDEBAR_SOCIAL_STYLES: Record<SocialPlatform, string> = {
  x: "bg-social-x",
  facebook: "bg-social-facebook",
  instagram: "bg-social-instagram",
  youtube: "bg-social-youtube",
  linkedin: "bg-social-linkedin",
  telegram: "bg-social-telegram",
};

const HERO_FIGURES = [
  { key: "cleaner", src: cleanerImage, className: "h-[150px] w-auto" },
  { key: "rider", src: riderImage, className: "h-[128px] w-auto" },
  { key: "painter", src: painterImage, className: "h-[172px] w-auto" },
  { key: "mechanic", src: mechanicImage, className: "h-[172px] w-auto" },
] as const;

export function BlogListingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category") ?? "";
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const [draftQuery, setDraftQuery] = useState(q);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [items, setItems] = useState<BlogCard[]>([]);
  const [featured, setFeatured] = useState<BlogCard | null>(null);
  const [sections, setSections] = useState<{ title: string; items: BlogCard[] }[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [latestIndex, setLatestIndex] = useState(0);

  useEffect(() => {
    setDraftQuery(q);
  }, [q]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const filtered = Boolean(category || q);
    const requests: Promise<void>[] = [
      fetchBlogCategories()
        .then((rows) => {
          if (active) setCategories(rows);
        }),
      fetchPublishedBlogs({ page, limit: filtered ? 9 : 6, q, category })
        .then((data) => {
          if (!active) return;
          setItems(data.items);
          setTotalPages(data.pagination.totalPages);
        }),
    ];
    if (!filtered && page === 1) {
      requests.push(
        fetchFeaturedBlog().then((row) => {
          if (active) setFeatured(row);
        }),
        Promise.all(
          SECTION_GROUPS.map(async (group) => {
            const lists = await Promise.all(
              group.slugs.map((slug) => fetchBlogsByCategory(slug, 4).catch(() => ({ items: [] }))),
            );
            const merged: BlogCard[] = [];
            for (const list of lists) {
              for (const item of list.items) {
                if (!merged.some((existing) => existing.id === item.id)) merged.push(item);
              }
            }
            return { title: group.title, items: merged.slice(0, 4) };
          }),
        ).then((rows) => {
          if (active) setSections(rows.filter((row) => row.items.length > 0));
        }),
      );
    } else if (active) {
      setFeatured(null);
      setSections([]);
    }
    Promise.all(requests)
      .catch(() => {
        if (active) setError("Articles could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, q, page]);

  function pushQuery(next: { category?: string; q?: string; page?: number }) {
    const query = new URLSearchParams();
    const nextCategory = next.category ?? category;
    const nextQ = next.q ?? q;
    const nextPage = next.page ?? 1;
    if (nextCategory) query.set("category", nextCategory);
    if (nextQ) query.set("q", nextQ);
    if (nextPage > 1) query.set("page", String(nextPage));
    const suffix = query.toString();
    router.push(suffix ? `${ROUTES.BLOGS}?${suffix}` : ROUTES.BLOGS, { scroll: false });
  }

  function subscribe(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  }

  const filtered = Boolean(category || q);
  const lead = featured ?? items[0] ?? null;
  const latestPool = lead ? [lead, ...items.filter((item) => item.id !== lead.id)] : items;
  const feature = latestPool.length > 0 ? latestPool[latestIndex % latestPool.length] : null;
  const sideCards = latestPool.length > 1
    ? [1, 2].map((offset) => latestPool[(latestIndex + offset) % latestPool.length]).filter((item) => item.id !== feature?.id)
    : [];
  const sidebarSocials = ["instagram", "linkedin", "x", "facebook", "youtube"]
    .map((id) => SOCIAL_LINKS.find((link) => link.id === id))
    .filter((link): link is (typeof SOCIAL_LINKS)[number] => Boolean(link));

  return (
    <Container className="pb-8 pt-0 sm:pb-10">
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f4fbf8]">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-6 lg:pl-8 lg:pr-[28rem] xl:pl-10 xl:pr-[30rem]">
          <div className="min-w-0">
            <h1 className="text-[1.7rem] font-bold leading-tight tracking-[-0.03em] text-[#1c2430] sm:text-[2rem]">
              Career Insights & Hiring Resources
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5c6770]">
              Explore career guidance, hiring strategies, skill development, and the latest employment opportunities.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <form
                className="relative w-full max-w-[240px]"
                onSubmit={(event) => {
                  event.preventDefault();
                  pushQuery({ q: draftQuery.trim(), page: 1 });
                }}
              >
                <label className="sr-only" htmlFor="blog-search">
                  Search blogs
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b97a3]" aria-hidden="true" />
                <input
                  id="blog-search"
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  placeholder="Search Blogs"
                  className="h-10 w-full rounded-lg border border-[#e4ebe8] bg-white py-2 pl-9 pr-3 text-sm text-[#1c2430] outline-none ring-primary/30 placeholder:text-[#9aa6b2] focus:ring-2"
                />
              </form>
              <FilterChip active={!category} onClick={() => pushQuery({ category: "", page: 1 })}>
                All
              </FilterChip>
              {categories.map((item) => (
                <FilterChip
                  key={item.id}
                  active={category === item.slug}
                  onClick={() => pushQuery({ category: item.slug, page: 1 })}
                >
                  {item.name}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0 hidden items-end gap-3 lg:flex" aria-hidden="true">
          {HERO_FIGURES.map((figure) => (
            <Image key={figure.key} src={figure.src} alt="" width={220} height={240} className={cn("object-contain object-bottom", figure.className)} />
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-10 rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">{error}</p>
      ) : null}

      {loading ? <ListingSkeleton /> : null}

      {!loading && !error && items.length === 0 && !lead ? (
        <p className="mt-12 text-sm text-muted">No articles match this search yet.</p>
      ) : null}

      {!loading && !error && filtered && items.length > 0 ? (
        <div className="mt-8 grid gap-y-12">
          {Array.from({ length: Math.ceil(items.length / 3) }, (_, index) => items.slice(index * 3, index * 3 + 3)).map((group) => (
            <div key={group[0].id} className="grid items-start gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
              <CategoryLeadCard blog={group[0]} />
              {group.length > 1 ? (
                <div className="grid content-start gap-5">
                  {group.slice(1).map((blog) => (
                    <CategoryStackCard key={blog.id} blog={blog} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !error && !filtered && lead ? (
        <div className="mt-12 grid items-start gap-y-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-x-8 xl:gap-x-10">
          <div className="flex items-center justify-between gap-4 lg:col-start-1 lg:row-start-1">
            <h2 id="latest-insights" className="text-xl font-bold tracking-tight text-[#1c2430] sm:text-2xl">
              Latest Insights & Articles
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous articles"
                disabled={latestPool.length < 2}
                onClick={() => setLatestIndex((index) => (index - 1 + latestPool.length) % latestPool.length)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-border-subtle bg-white text-foreground shadow-sm transition-[scale,border-color,background-color,color,box-shadow] hover:border-primary/40 hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-95 active:border-primary active:bg-primary-light active:text-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next articles"
                disabled={latestPool.length < 2}
                onClick={() => setLatestIndex((index) => (index + 1) % latestPool.length)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-md shadow-primary/20 transition-[scale,border-color,background-color,box-shadow] hover:border-primary-hover hover:bg-primary-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-95 active:border-primary-hover active:bg-primary-hover disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <section aria-labelledby="latest-insights">
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] xl:gap-6">
                {feature ? (
                  <CategoryLeadCard blog={feature} />
                ) : null}
                <div className="grid content-start gap-5">
                  {sideCards.map((blog) => (
                    <CategoryStackCard key={blog.id} blog={blog} />
                  ))}
                </div>
              </div>
            </section>
            {sections.map((section) => (
              <section key={section.title} className="mt-12 border-t border-[#e4ebe8] pt-8">
                <header className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold tracking-tight text-[#1c2430]">{section.title}</h2>
                  <span className="shrink-0 rounded-full bg-primary-light px-3 py-1 text-[11px] font-semibold text-primary">
                    {section.items.length} {section.items.length === 1 ? "article" : "articles"}
                  </span>
                </header>
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] xl:gap-6">
                  {section.items[0] ? (
                    <div className="order-1 min-w-0 lg:order-2">
                      <CategoryLeadCard blog={section.items[0]} />
                    </div>
                  ) : null}
                  <div className="order-2 grid content-start gap-5 lg:order-1">
                    {section.items.slice(1, 3).map((blog) => (
                      <CategoryStackCard key={blog.id} blog={blog} large />
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
          <form
            onSubmit={subscribe}
            className="relative isolate flex flex-col self-start overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-light via-white to-primary/[0.08] px-5 py-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] lg:sticky lg:top-24 lg:col-start-2 lg:row-start-2"
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 -z-10 size-40 rounded-full bg-primary/15 blur-3xl" />
            <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary shadow-sm">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-lg font-bold leading-snug tracking-tight text-[#1c2430]">Stay Updated with the Latest Insights</p>
            <p className="mt-2 text-sm leading-relaxed text-[#6b7780]">Get fresh career guidance and hiring insights in your inbox.</p>
            {subscribed ? (
              <p className="mt-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5 text-sm font-medium text-[#166534]">Thanks. You are on the list.</p>
            ) : (
              <>
                <label className="sr-only" htmlFor="blog-newsletter">
                  Email address
                </label>
                <input
                  id="blog-newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter Email"
                  className="mt-5 h-11 w-full rounded-xl border border-border-subtle bg-white px-3.5 text-sm outline-none ring-primary/30 placeholder:text-[#9aa6b2] transition-shadow focus:ring-2"
                />
                <button
                  type="submit"
                  className="mt-3 h-11 w-full rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/20 transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  Subscribe Now
                </button>
              </>
            )}
            <div className="mt-5 border-t border-primary/10 pt-4">
              <p className="text-xs font-semibold leading-snug text-[#3d4750]">Follow AsliJobs</p>
              <div className="mt-2 flex items-center gap-2">
                {sidebarSocials.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                      SIDEBAR_SOCIAL_STYLES[link.id],
                    )}
                  >
                    <SocialIcon platform={link.id} className="size-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {!loading && totalPages > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => pushQuery({ page: page - 1 })}
            className="rounded-full border border-border-subtle px-5 py-2 text-sm font-semibold text-foreground hover:bg-primary-light disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => pushQuery({ page: page + 1 })}
            className="rounded-full border border-border-subtle px-5 py-2 text-sm font-semibold text-foreground hover:bg-primary-light disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </Container>
  );
}

function ReadingTime({ minutes }: { minutes: number }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-[#8b97a3]">
      <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {formatReadingTime(minutes)}
    </span>
  );
}

function CategoryStackCard({ blog, large = false }: { blog: BlogCard; large?: boolean }) {
  return (
    <Link
      href={ROUTES.blog(blog.slug)}
      className={cn(
        "group flex min-w-0 items-start gap-3.5 rounded-2xl border border-[#e4ebe8] bg-white p-3 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_28px_rgba(15,23,42,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      <span className={cn("relative shrink-0 overflow-hidden rounded-xl bg-primary-light", large ? "size-24 sm:size-28" : "size-24 sm:size-32")}>
        {blog.coverImageUrl ? <img src={blog.coverImageUrl} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" /> : null}
      </span>
      <span className="min-w-0 pt-0.5">
        <ReadingTime minutes={blog.readingTimeMinutes} />
        <span className={cn("mt-1.5 line-clamp-2 font-bold leading-snug text-[#1c2430] transition-colors group-hover:text-primary", large ? "text-[15px]" : "text-base")}>
          {blog.title}
        </span>
        {blog.excerpt ? (
          <span className={cn("mt-1.5 line-clamp-2 leading-relaxed text-[#6b7780]", large ? "text-[13px]" : "text-sm")}>{blog.excerpt}</span>
        ) : null}
      </span>
    </Link>
  );
}

function CategoryLeadCard({ blog }: { blog: BlogCard }) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-3xl border border-[#e4ebe8] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.06)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_36px_rgba(15,23,42,0.11)]">
      <Link
        href={ROUTES.blog(blog.slug)}
        className="relative block aspect-[2/1] overflow-hidden bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
      >
        {blog.coverImageUrl ? (
          <img src={blog.coverImageUrl} alt={blog.coverImageAlt || blog.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <span className="block size-full" />
        )}
      </Link>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <ReadingTime minutes={blog.readingTimeMinutes} />
          {blog.category?.name ? (
            <span className="max-w-[55%] truncate rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
              {blog.category.name}
            </span>
          ) : null}
        </div>
        <h3 className="mt-2.5 text-lg font-bold leading-snug tracking-tight text-[#1c2430] sm:text-xl">
          <Link href={ROUTES.blog(blog.slug)} className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            {blog.title}
          </Link>
        </h3>
        {blog.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#6b7780]">{blog.excerpt}</p> : null}
        <Link
          href={ROUTES.blog(blog.slug)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-[gap,color] hover:gap-2.5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Read article
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 rounded-lg border px-3.5 text-[13px] font-semibold leading-none transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-[#e4ebe8] bg-white text-[#3d4750] hover:border-primary/30",
      )}
    >
      {children}
    </button>
  );
}

function ListingSkeleton() {
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="aspect-[16/10] animate-pulse rounded-3xl bg-primary-light" />
        <div className="grid content-start gap-4">
          <div className="h-32 animate-pulse rounded-2xl bg-primary-light" />
          <div className="h-32 animate-pulse rounded-2xl bg-primary-light" />
        </div>
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-primary-light" />
    </div>
  );
}
