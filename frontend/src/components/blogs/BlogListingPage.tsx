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
import { formatBlogDate, formatReadingTime } from "@/utils/blog-format";
import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight, Clock3, Mail, Search } from "lucide-react";
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

      {!loading && !error && filtered ? (
        <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {items.map((blog) => (
            <RowCard key={blog.id} blog={blog} />
          ))}
        </div>
      ) : null}

      {!loading && !error && !filtered && lead ? (
        <div className="mt-10 grid gap-x-6 gap-y-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex items-center justify-between gap-4 lg:col-start-1 lg:row-start-1">
            <h2 id="latest-insights" className="text-lg font-bold text-[#1c2430]">
              Latest Insights & Articles
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous articles"
                disabled={latestPool.length < 2}
                onClick={() => setLatestIndex((index) => (index - 1 + latestPool.length) % latestPool.length)}
                className="inline-flex size-8 items-center justify-center rounded-full border border-[#d5dee6] text-[#3d4750] disabled:opacity-40"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next articles"
                disabled={latestPool.length < 2}
                onClick={() => setLatestIndex((index) => (index + 1) % latestPool.length)}
                className="inline-flex size-8 items-center justify-center rounded-full bg-[#1c2430] text-white disabled:opacity-40"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <section aria-labelledby="latest-insights">
              <div className="grid items-start gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
                {feature ? (
                  <div className="min-w-0">
                    <Link href={ROUTES.blog(feature.slug)} className="block overflow-hidden rounded-xl bg-primary-light">
                      {feature.coverImageUrl ? (
                        <img src={feature.coverImageUrl} alt={feature.coverImageAlt || feature.title} className="aspect-[2/1] w-full object-cover" />
                      ) : (
                        <span className="block aspect-[2/1]" />
                      )}
                    </Link>
                    <div className="mt-3">
                      <ReadingTime minutes={feature.readingTimeMinutes} />
                      <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#1c2430]">
                        <Link href={ROUTES.blog(feature.slug)} className="hover:text-primary">
                          {feature.title}
                        </Link>
                      </h3>
                      {feature.excerpt ? <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[#6b7780]">{feature.excerpt}</p> : null}
                    </div>
                  </div>
                ) : null}
                <div className="grid content-start gap-5">
                  {sideCards.map((blog) => (
                    <CategoryStackCard key={blog.id} blog={blog} />
                  ))}
                </div>
              </div>
            </section>
            {sections.map((section) => (
              <section key={section.title} className="mt-12">
                <h2 className="text-lg font-bold text-[#1c2430]">{section.title}</h2>
                <div className="mt-4 grid items-center gap-x-6 gap-y-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
                  <div className="grid content-start gap-5">
                    {section.items.slice(1, 3).map((blog) => (
                      <CategoryStackCard key={blog.id} blog={blog} large />
                    ))}
                  </div>
                  {section.items[0] ? <CategoryLeadCard blog={section.items[0]} /> : null}
                </div>
              </section>
            ))}
          </div>
          <form onSubmit={subscribe} className="flex flex-col self-start rounded-2xl bg-primary-light px-4 py-5 lg:col-start-2 lg:row-start-2">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-white text-primary">
              <Mail className="size-4" aria-hidden="true" />
            </span>
            <p className="mt-3 text-[15px] font-bold leading-snug text-[#1c2430]">Stay Updated with the Latest Insights</p>
            {subscribed ? (
              <p className="mt-4 text-sm text-foreground">Thanks. You are on the list.</p>
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
                  className="mt-4 w-full rounded-lg border border-white bg-white px-3 py-2.5 text-sm outline-none ring-primary/30 placeholder:text-[#9aa6b2] focus:ring-2"
                />
                <button
                  type="submit"
                  className="mt-3 h-10 w-full rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Subscribe Now
                </button>
              </>
            )}
            <div className="mt-4">
              <p className="text-xs font-medium leading-snug text-[#3d4750]">Stay Upto date with Aslijobs</p>
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
    <Link href={ROUTES.blog(blog.slug)} className="group flex min-w-0 items-start gap-3.5">
      <span className={cn("shrink-0 overflow-hidden rounded-lg bg-primary-light", large ? "size-32" : "size-36")}>
        {blog.coverImageUrl ? <img src={blog.coverImageUrl} alt="" className="size-full object-cover" /> : null}
      </span>
      <span className="min-w-0">
        <ReadingTime minutes={blog.readingTimeMinutes} />
        <span className={cn("mt-1 line-clamp-2 font-bold leading-snug text-[#1c2430] group-hover:text-primary", large ? "text-[15px]" : "text-base")}>
          {blog.title}
        </span>
        {blog.excerpt ? (
          <span className={cn("mt-1 line-clamp-2 leading-relaxed text-[#6b7780]", large ? "text-[13px]" : "text-sm")}>{blog.excerpt}</span>
        ) : null}
      </span>
    </Link>
  );
}

function CategoryLeadCard({ blog }: { blog: BlogCard }) {
  return (
    <div className="min-w-0">
      <Link href={ROUTES.blog(blog.slug)} className="block overflow-hidden rounded-xl bg-primary-light">
        {blog.coverImageUrl ? (
          <img src={blog.coverImageUrl} alt={blog.coverImageAlt || blog.title} className="aspect-[2/1] w-full object-cover" />
        ) : (
          <span className="block aspect-[2/1]" />
        )}
      </Link>
      <div className="mt-3">
        <ReadingTime minutes={blog.readingTimeMinutes} />
        <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#1c2430]">
          <Link href={ROUTES.blog(blog.slug)} className="hover:text-primary">
            {blog.title}
          </Link>
        </h3>
        {blog.excerpt ? <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[#6b7780]">{blog.excerpt}</p> : null}
      </div>
    </div>
  );
}

function RowCard({ blog }: { blog: BlogCard }) {
  const date = blog.publishedAt ? formatBlogDate(blog.publishedAt) : "";
  return (
    <Link href={ROUTES.blog(blog.slug)} className="group flex min-w-0 gap-3">
      <span className="h-[4.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-xl bg-primary-light sm:h-20 sm:w-28">
        {blog.coverImageUrl ? (
          <img src={blog.coverImageUrl} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : null}
      </span>
      <span className="min-w-0">
        {date ? <span className="block text-xs font-semibold text-primary">{date}</span> : null}
        <span className="mt-0.5 line-clamp-2 block text-sm font-bold leading-snug text-foreground group-hover:text-primary">
          {blog.title}
        </span>
        {blog.excerpt ? <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted">{blog.excerpt}</span> : null}
      </span>
    </Link>
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
    <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_240px]">
      <div className="aspect-[16/10] animate-pulse rounded-xl bg-primary-light" />
      <div className="grid gap-4">
        <div className="h-20 animate-pulse rounded-xl bg-primary-light" />
        <div className="h-20 animate-pulse rounded-xl bg-primary-light" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-primary-light" />
    </div>
  );
}
