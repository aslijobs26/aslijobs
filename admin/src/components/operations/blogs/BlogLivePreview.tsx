import styles from "./blog-live-preview.module.css";
import logo from "../../../../../frontend/src/assets/AsliLogo.svg";
import { cn } from "../../../utils/cn";
import { Bookmark, Briefcase, Calendar, Clock3, Globe, Home, Link2, Monitor, PlusCircle, Smartphone, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Heading = { id: string; text: string; level: 2 | 3 };
type Device = "laptop" | "mobile";

/** Same widths the public site uses for a laptop window and a phone. */
const LAPTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;

export function BlogLivePreview({
  title,
  excerpt,
  content,
  categoryName,
  authorName,
  authorImageUrl,
  coverImageUrl,
  coverImageAlt,
  readingTimeMinutes,
  headings,
  faqs,
}: {
  title: string;
  excerpt: string;
  content: string;
  categoryName: string;
  authorName: string;
  authorImageUrl: string;
  coverImageUrl: string;
  coverImageAlt: string;
  readingTimeMinutes: number;
  headings: Heading[];
  faqs: { question: string; answer: string }[];
}) {
  const [device, setDevice] = useState<Device>("laptop");
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date()),
    [],
  );

  return (
    <div className={`${styles.article} overflow-hidden rounded-2xl border border-border-subtle shadow-sm`}>
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-primary-light/50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Live preview</p>
        <div className="flex rounded-lg bg-white p-0.5" role="tablist" aria-label="Preview size">
          <DeviceButton active={device === "laptop"} label="Laptop" onClick={() => setDevice("laptop")}>
            <Monitor className="size-3.5" aria-hidden />
          </DeviceButton>
          <DeviceButton active={device === "mobile"} label="Mobile" onClick={() => setDevice("mobile")}>
            <Smartphone className="size-3.5" aria-hidden />
          </DeviceButton>
        </div>
      </div>

      <ScaledFrame
        width={device === "laptop" ? LAPTOP_WIDTH : MOBILE_WIDTH}
        watch={`${device}:${title}:${excerpt}:${content}:${categoryName}:${authorName}:${coverImageUrl}:${headings.length}:${faqs.map((item) => item.question).join("|")}`}
      >
        <div className="relative bg-white text-foreground">
          <SiteHeader device={device} />
          <div className={device === "laptop" ? "px-10 py-10" : "px-4 py-8 pb-28"}>
            <ArticleCanvas
              device={device}
              title={title}
              excerpt={excerpt}
              content={content}
              categoryName={categoryName}
              authorName={authorName}
              authorImageUrl={authorImageUrl}
              coverImageUrl={coverImageUrl}
              coverImageAlt={coverImageAlt}
              readingTimeMinutes={readingTimeMinutes}
              headings={headings}
              faqs={faqs}
              dateLabel={dateLabel}
            />
          </div>
          {device === "mobile" ? <MobileTabBar /> : null}
          <span className="absolute bottom-5 right-5 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md" aria-hidden>
            <WhatsAppMark filled />
          </span>
        </div>
      </ScaledFrame>
    </div>
  );
}

function SiteHeader({ device }: { device: Device }) {
  const laptop = device === "laptop";
  return (
    <header className="border-b border-border-subtle bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
      <div className={cn("flex items-center", laptop ? "min-h-20 gap-6 px-10 py-2" : "min-h-16 gap-2 px-3 py-1.5")}>
        <span className="flex min-w-0 flex-col items-start">
          <img src={logo} alt="" className={laptop ? "h-[52px] w-auto" : "h-[30px] w-auto"} />
          <span className={cn("truncate font-bold leading-tight text-muted", laptop ? "text-[9px]" : "max-w-[8.75rem] text-[7px]")}>
            India's 1st WhatsApp Job Platform
          </span>
        </span>
        <div className={cn("ml-auto flex shrink-0 items-center", laptop ? "gap-3" : "gap-1.5")}>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-border bg-white font-medium text-foreground", laptop ? "h-10 px-3 text-sm" : "h-9 px-2.5 text-xs")}>
            <Globe className="size-4" aria-hidden />
            English
          </span>
          {laptop ? (
            <>
              <span className="inline-flex h-10 items-center rounded-md bg-primary-soft px-5 text-[15px] font-medium text-white">
                Job Seeker
              </span>
              <span className="inline-flex h-10 items-center rounded-md border border-primary px-5 text-[15px] font-medium text-primary">
                Employers
              </span>
            </>
          ) : (
            <span className="inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground">
              <UserRound className="size-4" aria-hidden />
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileTabBar() {
  const items = [
    { label: "Home", icon: Home },
    { label: "Jobs", icon: Briefcase },
    { label: "Post", icon: PlusCircle },
    { label: "Saved", icon: Bookmark },
    { label: "Profile", icon: UserRound },
  ];
  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-border-subtle bg-white px-1 py-2 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
      {items.map((item) => (
        <span key={item.label} className="flex flex-1 flex-col items-center gap-0.5 text-[10px] font-medium text-muted">
          <item.icon className="size-5" aria-hidden />
          {item.label}
        </span>
      ))}
    </nav>
  );
}

function ArticleCanvas({
  device,
  title,
  excerpt,
  content,
  categoryName,
  authorName,
  authorImageUrl,
  coverImageUrl,
  coverImageAlt,
  readingTimeMinutes,
  headings,
  faqs,
  dateLabel,
}: {
  device: Device;
  title: string;
  excerpt: string;
  content: string;
  categoryName: string;
  authorName: string;
  authorImageUrl: string;
  coverImageUrl: string;
  coverImageAlt: string;
  readingTimeMinutes: number;
  headings: Heading[];
  faqs: { question: string; answer: string }[];
  dateLabel: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const laptop = device === "laptop";
  const context = headings.some((heading) => heading.level === 2)
    ? headings.filter((heading) => heading.level === 2)
    : headings;
  const initial = (authorName.trim().charAt(0) || "A").toUpperCase();

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    for (const image of root.querySelectorAll("img")) {
      const hide = () => {
        if (image.naturalWidth >= 64 && image.naturalHeight >= 64) return;
        const figure = image.closest("figure");
        const target = figure && figure.querySelectorAll("img").length === 1 ? figure : image;
        target.setAttribute("hidden", "");
      };
      if (image.complete) hide();
      else image.addEventListener("load", hide, { once: true });
    }
  }, [content, device]);

  return (
    <div className={cn("grid items-start", laptop ? "grid-cols-[minmax(0,1fr)_18rem] gap-10" : "gap-8")}>
      <article className="min-w-0">
        <p className="text-[13px] text-muted">
          Career Insights
          {categoryName ? <span className="mx-1.5">/</span> : null}
          {categoryName ? <span>{categoryName}</span> : null}
        </p>
        <h1
          className={cn(
            "mt-4 max-w-[46rem] font-bold leading-[1.15] tracking-[-0.03em] text-foreground",
            laptop ? "text-[2.35rem]" : "text-[1.85rem]",
          )}
        >
          {title.trim() || "Article title"}
        </h1>
        {excerpt.trim() ? (
          <p className={cn("mt-3 max-w-[46rem] leading-relaxed text-muted", laptop ? "text-base" : "text-[15px]")}>
            {excerpt.trim()}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-white px-3 py-1.5">
              <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              {Math.max(1, readingTimeMinutes || 1)} min read
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-white px-3 py-1.5">
              <Calendar className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              {dateLabel}
            </span>
          </div>
          <ShareMarks />
        </div>

        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={coverImageAlt || title}
            className="mt-5 aspect-[16/8] w-full rounded-2xl object-cover"
          />
        ) : null}

        <div className="w-full">
          {content.trim() ? (
            <div
              ref={bodyRef}
              className={cn(styles.body, laptop ? "mt-7" : styles.bodyMobile, !laptop && "mt-6")}
              dangerouslySetInnerHTML={{ __html: withYoutubePreview(content) }}
            />
          ) : (
            <p className={cn("text-muted", laptop ? "mt-7 text-base" : "mt-6 text-sm")}>The article body appears here as you write.</p>
          )}

          {faqs.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-[1.65rem] font-bold tracking-[-0.02em] text-foreground">Frequently Asked Questions</h2>
              <div className="mt-2">
                {faqs.map((item) => (
                  <details key={item.question} className="py-4">
                    <summary className="cursor-pointer list-none text-[15px] leading-relaxed text-muted marker:content-none [&::-webkit-details-marker]:hidden">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-10 rounded-xl border border-border-subtle px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Written by</p>
            <div className="mt-2.5 flex items-center gap-3">
              {authorImageUrl ? (
                <img src={authorImageUrl} alt="" className="size-10 rounded-full object-cover" />
              ) : (
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initial}
                </span>
              )}
              <p className="font-semibold text-foreground">{authorName.trim() || "AsliJobs"}</p>
            </div>
          </div>
        </div>
      </article>

      <aside className="grid gap-5">
        <div className="rounded-2xl border border-border-subtle bg-white p-5 text-center shadow-sm">
          <p className="text-base font-bold text-foreground">Find jobs on WhatsApp</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">Browse verified openings and apply in a few taps.</p>
          <span className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white">
            Find jobs
          </span>
        </div>
        {context.length > 0 ? (
          <div>
            <p className="text-sm font-bold text-foreground">Article context</p>
            <ul className="mt-3 space-y-2.5 border-t border-border-subtle pt-3">
              {context.map((heading) => (
                <li key={heading.id} className="flex gap-2 text-sm leading-snug text-foreground/80">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{heading.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function withYoutubePreview(html: string): string {
  return html.replace(/<iframe\b[^>]*>\s*<\/iframe>/gi, (iframe) => {
    const src = iframe.match(/\bsrc="([^"]+)"/i)?.[1] ?? "";
    const id = youtubeId(src);
    if (!id) return "";
    return `<figure class="blog-youtube"><a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="YouTube video" /></a></figure>`;
  });
}

function youtubeId(src: string): string {
  try {
    const url = new URL(src);
    const host = url.hostname.replace(/^(?:www|m|music)\./, "");
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0]?.split(/[?&#]/)[0] ?? "";
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") return parts[1]?.split(/[?&#]/)[0] ?? "";
      return url.searchParams.get("v") ?? "";
    }
  } catch {
    return "";
  }
  return "";
}

function ScaledFrame({
  width,
  watch,
  children,
}: {
  width: number;
  watch: string;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const nextScale = Math.min(1, outer.clientWidth / width);
      setScale(nextScale);
      setHeight(inner.offsetHeight * nextScale);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [width, watch]);

  return (
    <div ref={outerRef} className="w-full overflow-hidden bg-white" style={{ height: height || undefined }}>
      <div ref={innerRef} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

function DeviceButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold",
        active ? "bg-primary text-white" : "text-muted hover:text-foreground",
      )}
    >
      {children}
      {label}
    </button>
  );
}

function ShareMarks() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#25D366] text-white">
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.44-8.44zM12.07 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
        </svg>
      </span>
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#0A66C2] text-white">
        <LinkedInMark />
      </span>
      <span className="inline-flex size-7 items-center justify-center rounded-full border border-border-subtle bg-white text-foreground">
        <Link2 className="size-3.5" strokeWidth={2} />
      </span>
    </div>
  );
}

function WhatsAppMark({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={filled ? "size-7" : "size-[18px]"} fill="none" aria-hidden>
      <path
        d="M12.04 3.5A8.2 8.2 0 0 0 4.7 16.2L3.6 20.4l4.3-1.1A8.2 8.2 0 1 0 12.04 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}
