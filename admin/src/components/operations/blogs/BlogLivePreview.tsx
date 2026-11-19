import styles from "./blog-live-preview.module.css";
import { cn } from "../../../utils/cn";
import { Calendar, ChevronDown, Clock3, Link2, Monitor, Smartphone } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Heading = { id: string; text: string; level: 2 | 3 };
type Device = "laptop" | "mobile";

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

      <ScaledFrame width={device === "laptop" ? LAPTOP_WIDTH : MOBILE_WIDTH}>
        <div className={device === "laptop" ? "bg-white px-10 py-10" : "bg-white px-4 py-8"}>
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
      </ScaledFrame>
    </div>
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
    const cleanups: Array<() => void> = [];
    for (const image of root.querySelectorAll("img")) {
      const hide = () => {
        const figure = image.closest("figure");
        const target = figure && figure.querySelectorAll("img").length === 1 ? figure : image;
        target.setAttribute("hidden", "");
      };
      if (image.complete && image.naturalWidth === 0) hide();
      image.addEventListener("error", hide);
      cleanups.push(() => image.removeEventListener("error", hide));
    }
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
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
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className={cn("text-muted", laptop ? "mt-7 text-base" : "mt-6 text-sm")}>The article body appears here as you write.</p>
          )}

          {faqs.length > 0 ? (
            <section className="mt-12 border-t border-border-subtle pt-8">
              <h2 className="text-xl font-bold tracking-[-0.02em] text-foreground">Frequently Asked Questions</h2>
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
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border-subtle text-muted">
                        <ChevronDown className="size-3.5" aria-hidden />
                      </span>
                    </summary>
                    <p className="max-w-[40rem] pb-4 pl-11 pr-11 text-sm leading-7 text-muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-10 rounded-xl border border-primary/15 bg-gradient-to-r from-primary-light to-white px-4 py-3.5">
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

      <aside className={cn("grid gap-5", laptop && "lg:sticky lg:top-24")}>
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

function ScaledFrame({ width, children }: { width: number; children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextScale = Math.min(1, outer.clientWidth / width);
        const nextHeight = Math.round(inner.offsetHeight * nextScale);
        setScale((current) => (Math.abs(current - nextScale) < 0.001 ? current : nextScale));
        setHeight((current) => (current === nextHeight ? current : nextHeight));
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [width]);

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

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}
