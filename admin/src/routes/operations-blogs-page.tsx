import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import { env } from "../constants/env";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import {
  deleteAdminBlog,
  fetchAdminBlogs,
  fetchBlogCategoriesAdmin,
  updateAdminBlogStatus,
  type AdminBlog,
  type BlogCategoryRecord,
} from "../services/blogs.service";
import { cn } from "../utils/cn";
import { getOperationsApiErrorMessage } from "../utils/operations-api-errors";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  FileText,
  MoreHorizontal,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function localDayBound(value: string, end: boolean) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0).toISOString();
}

const TABS = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
] as const;

export function OperationsBlogsPage() {
  const [items, setItems] = useState<AdminBlog[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, scheduled: 0 });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [draftQ, setDraftQ] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<AdminBlog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<BlogCategoryRecord[]>([]);
  const [menu, setMenu] = useState<{ blog: AdminBlog; top: number; left: number } | null>(null);
  const appliedQuery = useRef("");

  const dateError = from && to && from > to ? "The start date must be on or before the end date." : null;

  const load = useCallback(async () => {
    if (from && to && from > to) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminBlogs({
        page,
        limit: 10,
        q,
        status,
        category,
        ...(from ? { from: localDayBound(from, false) } : {}),
        ...(to ? { to: localDayBound(to, true) } : {}),
      });
      setItems(data.items);
      setStats(data.stats);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(getOperationsApiErrorMessage(err, "Could not load blogs."));
    } finally {
      setLoading(false);
    }
  }, [page, q, status, category, from, to]);

  useEffect(() => {
    void fetchBlogCategoriesAdmin().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const next = draftQ.trim();
    const timer = window.setTimeout(() => {
      if (appliedQuery.current === next) return;
      appliedQuery.current = next;
      setQ(next);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftQ]);

  useEffect(() => {
    void load();
  }, [load]);

  function applySearch() {
    const next = draftQ.trim();
    appliedQuery.current = next;
    if (next === q && page === 1) {
      void load();
      return;
    }
    setQ(next);
    setPage(1);
  }

  useEffect(() => {
    if (!menu) return;
    function close() {
      setMenu(null);
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  function selectStatus(next: string) {
    setPage(1);
    setStatus(next);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * 10 + 1;
  const rangeEnd = Math.min(page * 10, total);

  return (
    <OperationsLayout
      title="Blogs"
      subtitle="Publish career insights, hiring guides, and resources for the public site."
    >
      <div className="flex flex-col gap-3">
        <section aria-label="Blog totals" className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard label="Total blogs" value={stats.total} caption="All articles" icon={Newspaper} selected={status === ""} onClick={() => selectStatus("")} />
          <KpiCard label="Published" value={stats.published} caption="Live on the site" icon={CheckCircle2} selected={status === "published"} onClick={() => selectStatus("published")} />
          <KpiCard label="Drafts" value={stats.draft} caption="Not public" icon={FileText} selected={status === "draft"} onClick={() => selectStatus("draft")} />
          <KpiCard label="Scheduled" value={stats.scheduled} caption="Waiting to publish" icon={CalendarClock} selected={status === "scheduled"} onClick={() => selectStatus("scheduled")} />
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border-subtle p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Article status">
              {TABS.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.value}
                  className={cn(
                    "h-8 shrink-0 rounded-md px-3 text-xs font-semibold transition-colors",
                    status === tab.value ? "bg-primary text-white" : "text-muted hover:bg-hero-bg hover:text-foreground",
                  )}
                  onClick={() => selectStatus(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Link to={OPERATIONS_ROUTES.BLOGS_NEW} className={primaryButtonClass}>
              <Plus className="size-3.5" aria-hidden />
              Create blog
            </Link>
          </div>
          <form
            className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_repeat(2,minmax(0,0.7fr))_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              applySearch();
            }}
          >
            <label className="relative block sm:col-span-2 xl:col-span-1">
              <span className="sr-only">Search title</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
              <input className={cn(fieldClass, "pl-8")} placeholder="Search title or slug" value={draftQ} onChange={(event) => setDraftQ(event.target.value)} />
            </label>
            <OperationsFilterSelect
              label="Category"
              value={category}
              options={[{ value: "", label: "All categories" }, ...categories.map((item) => ({ value: item.id, label: item.name }))]}
              onChange={(value) => {
                setPage(1);
                setCategory(value);
              }}
            />
            <input className={fieldClass} type="date" aria-label="Updated from" max={to || undefined} value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} />
            <input className={fieldClass} type="date" aria-label="Updated to" min={from || undefined} value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} />
            <button type="submit" className={secondaryButtonClass}>Search</button>
            {dateError ? <p className="text-xs text-danger sm:col-span-2 xl:col-span-full">{dateError}</p> : null}
          </form>
        </section>

        {error ? <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="overflow-x-auto overscroll-x-contain scrollbar-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-hero-bg/70 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Article</th>
                  <th className="px-3 py-2.5 font-semibold">Category</th>
                  <th className="px-3 py-2.5 font-semibold">Author</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Featured</th>
                  <th className="px-3 py-2.5 font-semibold">Published</th>
                  <th className="px-3 py-2.5 font-semibold">Updated</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <tr key={index} className="border-t border-border-subtle">
                        <td className="px-3 py-3" colSpan={8}>
                          <div className="h-10 animate-pulse rounded-lg bg-hero-bg" />
                        </td>
                      </tr>
                    ))
                  : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td className="px-3 py-14 text-center" colSpan={8}>
                      <p className="text-sm font-semibold text-foreground">No articles yet</p>
                      <p className="mt-1 text-xs text-muted">Create a blog or change the filters to see articles here.</p>
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? items.map((blog) => (
                      <tr key={blog.id} className="border-t border-border-subtle align-middle hover:bg-hero-bg/50">
                        <td className="px-3 py-2.5">
                          <Link to={`${OPERATIONS_ROUTES.BLOGS}/${blog.id}/edit`} className="flex min-w-0 items-center gap-3">
                            {blog.coverImage?.url ? (
                              <img src={coverThumb(blog.coverImage.url)} alt="" className="h-10 w-16 shrink-0 rounded-md bg-hero-bg object-cover" />
                            ) : (
                              <span className="inline-flex h-10 w-16 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
                                <Newspaper className="size-4" aria-hidden />
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-foreground">{blog.title}</span>
                              <span className="block truncate text-xs text-muted">{blog.slug}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-foreground">{blog.category?.name || "—"}</td>
                        <td className="px-3 py-2.5 text-foreground">{blog.authorName || "—"}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={blog.status} /></td>
                        <td className="px-3 py-2.5">
                          {blog.isFeatured ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                              <Star className="size-3.5 fill-current text-warning" aria-hidden />
                              Featured
                            </span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-muted">{formatDate(blog.publishedAt)}</td>
                        <td className="px-3 py-2.5 tabular-nums text-muted">{formatDate(blog.updatedAt)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            className={iconButtonClass}
                            aria-label={`Actions for ${blog.title}`}
                            aria-expanded={menu?.blog.id === blog.id}
                            onClick={(event) => {
                              const rect = event.currentTarget.getBoundingClientRect();
                              setMenu((current) =>
                                current?.blog.id === blog.id
                                  ? null
                                  : { blog, top: rect.bottom + 6, left: Math.max(8, rect.right - 188) },
                              );
                            }}
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-3 py-2.5 text-sm">
            <p className="text-xs text-muted">
              {total === 0 ? "0 articles" : `${rangeStart}–${rangeEnd} of ${total}`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Page {page} of {totalPages}</span>
              <button type="button" className={secondaryButtonClass} disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
              <button type="button" className={secondaryButtonClass} disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        </section>
      </div>

      {menu ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close actions" onClick={() => setMenu(null)} />
          <div className="fixed z-50 w-44 overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-md" style={{ top: menu.top, left: menu.left }} role="menu">
            <MenuLink to={`${OPERATIONS_ROUTES.BLOGS}/${menu.blog.id}/edit`} icon={Pencil} label="Edit" onClick={() => setMenu(null)} />
            <MenuLink to={`${OPERATIONS_ROUTES.BLOGS}/${menu.blog.id}/preview`} icon={Eye} label="Preview" onClick={() => setMenu(null)} />
            {menu.blog.status === "published" && env.publicSiteUrl ? (
              <MenuAnchor href={`${env.publicSiteUrl}/blogs/${menu.blog.slug}`} label="View on site" onClick={() => setMenu(null)} />
            ) : null}
            <button
              type="button"
              className={menuItemClass}
              role="menuitem"
              onClick={() => {
                const blog = menu.blog;
                setMenu(null);
                void updateAdminBlogStatus(blog.id, { status: blog.status === "published" ? "draft" : "published" }).then(load);
              }}
            >
              {menu.blog.status === "published" ? "Unpublish" : "Publish"}
            </button>
            <button
              type="button"
              className={cn(menuItemClass, "text-danger")}
              role="menuitem"
              onClick={() => {
                setPendingDelete(menu.blog);
                setMenu(null);
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          </div>
        </>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm" role="dialog" aria-modal="true" aria-labelledby="delete-blog-title">
            <h2 id="delete-blog-title" className="text-base font-bold text-foreground">Delete this article?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">“{pendingDelete.title}” will be removed from the site and this list. This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setPendingDelete(null)} disabled={deleting}>Cancel</button>
              <button
                type="button"
                className="inline-flex h-8 items-center rounded-md bg-danger px-3 text-xs font-semibold text-white disabled:opacity-50"
                disabled={deleting}
                onClick={() => {
                  setDeleting(true);
                  void deleteAdminBlog(pendingDelete.id)
                    .then(() => {
                      setPendingDelete(null);
                      return load();
                    })
                    .catch((err) => setError(getOperationsApiErrorMessage(err, "Could not delete the article.")))
                    .finally(() => setDeleting(false));
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}

const fieldClass =
  "h-8 w-full rounded-md border border-border-subtle bg-surface px-2.5 text-[11px] font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus:border-primary focus:ring-2 focus:ring-primary/30";

const primaryButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover";

const secondaryButtonClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/25 disabled:cursor-not-allowed disabled:opacity-40";

const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hero-bg hover:text-foreground";

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-hero-bg";

function coverThumb(url: string): string {
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  return `${url.slice(0, index + marker.length)}c_fill,g_auto,w_320,h_200,f_auto,q_auto/${url.slice(index + marker.length)}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function KpiCard({
  label,
  value,
  caption,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  value: number;
  caption: string;
  icon: typeof Newspaper;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-w-0 items-start justify-between gap-2 rounded-xl border border-border-subtle bg-surface p-3.5 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        selected && "ring-2 ring-primary/40",
      )}
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-muted">{label}</span>
        <span className="mt-1.5 block text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground">{value.toLocaleString("en-IN")}</span>
        <span className="mt-2 block truncate text-[11px] font-medium text-muted">{caption}</span>
      </span>
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-hero-bg text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "published"
      ? "bg-success/15 text-success"
      : status === "scheduled"
        ? "bg-warning/15 text-warning"
        : "bg-hero-bg text-muted";
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", styles)}>{status}</span>;
}

function MenuLink({ to, icon: Icon, label, onClick }: { to: string; icon: typeof Pencil; label: string; onClick: () => void }) {
  return (
    <Link to={to} className={menuItemClass} role="menuitem" onClick={onClick}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}

function MenuAnchor({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <a className={menuItemClass} role="menuitem" href={href} target="_blank" rel="noreferrer" onClick={onClick}>
      <Eye className="size-3.5" aria-hidden />
      {label}
    </a>
  );
}
