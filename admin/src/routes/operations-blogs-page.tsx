import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import { env } from "../constants/env";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import { OperationsFormField, operationsFieldInputClassName } from "../components/ui/OperationsFormField";
import { OperationsDatePicker } from "../components/ui/OperationsDatePicker";
import {
  deleteAdminBlog,
  fetchAdminBlogs,
  openSiteBlogPreview,
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
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";

function localDayBound(value: string, end: boolean) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0).toISOString();
}

function localDateKey(date = new Date()) {
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
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

  function openBlogMenu(event: MouseEvent<HTMLButtonElement>, blog: AdminBlog) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 160;
    const top =
      window.innerHeight - rect.bottom >= menuHeight + 8
        ? rect.bottom + 6
        : Math.max(8, rect.top - menuHeight - 6);
    const left = Math.min(
      Math.max(8, window.innerWidth - menuWidth - 8),
      Math.max(8, rect.right - menuWidth),
    );

    setMenu((current) =>
      current?.blog.id === blog.id ? null : { blog, top, left },
    );
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * 10 + 1;
  const rangeEnd = Math.min(page * 10, total);
  const today = localDateKey();

  return (
    <OperationsLayout
      title="Blogs"
      subtitle="Publish career insights, hiring guides, and resources for the public site."
    >
      <div className="flex flex-col gap-4">
        <section aria-label="Blog totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total blogs" value={stats.total} caption="All articles" icon={Newspaper} tone="primary" selected={status === ""} onClick={() => selectStatus("")} />
          <KpiCard label="Published" value={stats.published} caption="Live on the site" icon={CheckCircle2} tone="success" selected={status === "published"} onClick={() => selectStatus("published")} />
          <KpiCard label="Drafts" value={stats.draft} caption="Not public" icon={FileText} tone="neutral" selected={status === "draft"} onClick={() => selectStatus("draft")} />
          <KpiCard label="Scheduled" value={stats.scheduled} caption="Waiting to publish" icon={CalendarClock} tone="warning" selected={status === "scheduled"} onClick={() => selectStatus("scheduled")} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-hero-bg/70 p-1" role="tablist" aria-label="Article status">
              {TABS.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.value}
                  className={cn(
                    "h-9 shrink-0 rounded-lg px-3.5 text-xs font-semibold transition-colors",
                    status === tab.value ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-foreground",
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
            className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_repeat(2,minmax(0,0.7fr))_auto] xl:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              applySearch();
            }}
          >
            <OperationsFormField label="Search articles" htmlFor="blogs-search-title" className="sm:col-span-2 xl:col-span-1">
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
                <input id="blogs-search-title" className={cn(operationsFieldInputClassName, "pl-9")} placeholder="Title or slug" value={draftQ} onChange={(event) => setDraftQ(event.target.value)} />
              </span>
            </OperationsFormField>
            <OperationsFormField label="Category" htmlFor="blogs-category-filter">
              <OperationsFilterSelect
                id="blogs-category-filter"
                hideSrOnlyLabel
                mobileSheet
                triggerClassName="h-9 rounded-lg px-3 text-xs"
                label="Category"
                value={category}
                options={[{ value: "", label: "All categories" }, ...categories.map((item) => ({ value: item.id, label: item.name }))]}
                onChange={(value) => {
                  setPage(1);
                  setCategory(value);
                }}
              />
            </OperationsFormField>
            <OperationsFormField label="Updated from" htmlFor="blogs-updated-from">
              <div className="flex min-w-0 items-center gap-1">
                <OperationsDatePicker
                  id="blogs-updated-from"
                  value={from}
                  placeholder="Select start date"
                  maxDate={to || today}
                  compact
                  aria-label="Updated from"
                  onChange={(value) => { setPage(1); setFrom(value); }}
                />
                {from ? (
                  <button
                    type="button"
                    aria-label="Clear updated from date"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    onClick={() => { setPage(1); setFrom(""); }}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </OperationsFormField>
            <OperationsFormField label="Updated to" htmlFor="blogs-updated-to">
              <div className="flex min-w-0 items-center gap-1">
                <OperationsDatePicker
                  id="blogs-updated-to"
                  value={to}
                  placeholder="Select end date"
                  minDate={from || undefined}
                  maxDate={today}
                  compact
                  aria-label="Updated to"
                  onChange={(value) => { setPage(1); setTo(value); }}
                />
                {to ? (
                  <button
                    type="button"
                    aria-label="Clear updated to date"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    onClick={() => { setPage(1); setTo(""); }}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </OperationsFormField>
            <button type="submit" className={secondaryButtonClass}>Search</button>
            {dateError ? <p className="text-xs text-danger sm:col-span-2 xl:col-span-full">{dateError}</p> : null}
          </form>
        </section>

        {error ? <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
          <div className="grid gap-3 p-3 xl:hidden">
            {loading
              ? Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="h-36 animate-pulse rounded-xl bg-hero-bg" />
                ))
              : null}
            {!loading && items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-subtle px-4 py-10 text-center">
                <p className="text-sm font-semibold text-foreground">No articles yet</p>
                <p className="mt-1 text-xs text-muted">Create a blog or change the filters to see articles here.</p>
              </div>
            ) : null}
            {!loading
              ? items.map((blog) => (
                  <BlogMobileCard
                    key={blog.id}
                    blog={blog}
                    menuOpen={menu?.blog.id === blog.id}
                    onOpenMenu={openBlogMenu}
                  />
                ))
              : null}
          </div>
          <div className="hidden overflow-x-auto overscroll-x-contain scrollbar-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden xl:block">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-hero-bg/70 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Article</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Author</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Featured</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <tr key={index} className="border-t border-border-subtle">
                        <td className="px-4 py-3.5" colSpan={8}>
                          <div className="h-10 animate-pulse rounded-lg bg-hero-bg" />
                        </td>
                      </tr>
                    ))
                  : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-14 text-center" colSpan={8}>
                      <p className="text-sm font-semibold text-foreground">No articles yet</p>
                      <p className="mt-1 text-xs text-muted">Create a blog or change the filters to see articles here.</p>
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? items.map((blog) => (
                      <tr key={blog.id} className="border-t border-border-subtle align-middle transition-colors hover:bg-hero-bg/50">
                        <td className="px-4 py-3.5">
                          <Link to={`${OPERATIONS_ROUTES.BLOGS}/${blog.id}/edit`} className="flex min-w-0 items-center gap-3">
                            {blog.coverImage?.url ? (
                              <img src={coverThumb(blog.coverImage.url)} alt="" className="h-12 w-20 shrink-0 rounded-lg bg-hero-bg object-cover" />
                            ) : (
                              <span className="inline-flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                                <Newspaper className="size-4" aria-hidden />
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">{blog.title}</span>
                              <span className="mt-0.5 block truncate text-xs text-muted">{blog.slug}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-foreground">{blog.category?.name || "—"}</td>
                        <td className="px-4 py-3.5 text-sm text-foreground">{blog.authorName || "—"}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={blog.status} /></td>
                        <td className="px-4 py-3.5">
                          {blog.isFeatured ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                              <Star className="size-3.5 fill-current text-warning" aria-hidden />
                              Featured
                            </span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs tabular-nums text-muted">{formatDate(blog.publishedAt)}</td>
                        <td className="px-4 py-3.5 text-xs tabular-nums text-muted">{formatDate(blog.updatedAt)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            className={iconButtonClass}
                            aria-label={`Actions for ${blog.title}`}
                            aria-expanded={menu?.blog.id === blog.id}
                            onClick={(event) => openBlogMenu(event, blog)}
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
          <div className="flex flex-col gap-3 border-t border-border-subtle px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs text-muted">
              {total === 0 ? "0 articles" : `${rangeStart}–${rangeEnd} of ${total}`}
            </p>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
              <span className="text-xs tabular-nums text-muted">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button type="button" className={secondaryButtonClass} disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                <button type="button" className={secondaryButtonClass} disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {menu ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close actions" onClick={() => setMenu(null)} />
          <div className="fixed z-50 w-44 overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-md" style={{ top: menu.top, left: menu.left }} role="menu">
            <MenuLink to={`${OPERATIONS_ROUTES.BLOGS}/${menu.blog.id}/edit`} icon={Pencil} label="Edit" onClick={() => setMenu(null)} />
            {menu.blog.status === "published" && env.publicSiteUrl ? (
              <MenuAnchor
                href={`${env.publicSiteUrl}/blogs/${menu.blog.slug}?return=${encodeURIComponent(`${window.location.origin}/operations/blogs`)}`}
                label="View on site"
                onClick={() => setMenu(null)}
              />
            ) : menu.blog.status === "published" ? null : (
              <button
                type="button"
                className={menuItemClass}
                role="menuitem"
                onClick={() => {
                  const blog = menu.blog;
                  setMenu(null);
                  void openSiteBlogPreview(blog.id).catch((err) => {
                    setError(getOperationsApiErrorMessage(err, "Preview unavailable."));
                  });
                }}
              >
                <Eye className="size-3.5" aria-hidden />
                Preview
              </button>
            )}
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

const primaryButtonClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const secondaryButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3.5 text-xs font-semibold text-foreground shadow-sm transition-[border-color,background-color,box-shadow] hover:border-primary/25 hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40";

const iconButtonClass =
  "inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-hero-bg";

function coverThumb(url: string): string {
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  return `${url.slice(0, index + marker.length)}c_fill,g_auto,w_320,h_200,f_auto,q_auto/${url.slice(index + marker.length)}`;
}

function BlogMobileCard({
  blog,
  menuOpen,
  onOpenMenu,
}: {
  blog: AdminBlog;
  menuOpen: boolean;
  onOpenMenu: (event: MouseEvent<HTMLButtonElement>, blog: AdminBlog) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm transition-[border-color,box-shadow] hover:border-primary/20 hover:shadow-md">
      <div className="flex min-w-0 items-start gap-3.5 p-4">
        {blog.coverImage?.url ? (
          <img
            src={coverThumb(blog.coverImage.url)}
            alt=""
            className="h-16 w-20 shrink-0 rounded-xl bg-hero-bg object-cover ring-1 ring-border-subtle sm:h-[4.5rem] sm:w-[5.5rem]"
          />
        ) : (
          <span className="inline-flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary ring-1 ring-border-subtle sm:h-[4.5rem] sm:w-[5.5rem]">
            <Newspaper className="size-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-1.5">
            <Link
              to={`${OPERATIONS_ROUTES.BLOGS}/${blog.id}/edit`}
              className="min-w-0 flex-1"
            >
              <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {blog.title}
              </span>
              <span className="mt-1.5 block truncate text-[11px] text-muted">
                {blog.slug}
              </span>
            </Link>
            <button
              type="button"
              className={cn(iconButtonClass, "size-9 shrink-0 border border-transparent hover:border-border-subtle")}
              aria-label={`Actions for ${blog.title}`}
              aria-expanded={menuOpen}
              onClick={(event) => onOpenMenu(event, blog)}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={blog.status} />
            {blog.isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-foreground">
                <Star className="size-3 fill-current text-warning" aria-hidden />
                Featured
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-border-subtle bg-border-subtle">
        <BlogMobileMeta label="Category" value={blog.category?.name || "—"} />
        <BlogMobileMeta label="Author" value={blog.authorName || "—"} />
        <BlogMobileMeta label="Published" value={formatDate(blog.publishedAt)} />
        <BlogMobileMeta label="Updated" value={formatDate(blog.updatedAt)} />
      </div>
    </article>
  );
}

function BlogMobileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-[13px] font-medium leading-snug text-foreground">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

const KPI_TONES = {
  primary: {
    icon: "bg-primary-light text-primary",
    card: "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
    selected: "border-primary/40 ring-2 ring-primary/25 shadow-md",
  },
  success: {
    icon: "bg-success/10 text-success",
    card: "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
    selected: "border-success/35 ring-2 ring-success/20 shadow-md",
  },
  neutral: {
    icon: "bg-hero-bg text-muted",
    card: "border-border-subtle bg-gradient-to-br from-hero-bg to-white dark:from-surface dark:to-surface",
    selected: "border-muted/35 ring-2 ring-muted/15 shadow-md",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    card: "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
    selected: "border-warning/35 ring-2 ring-warning/20 shadow-md",
  },
} as const;

function KpiCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  selected,
  onClick,
}: {
  label: string;
  value: number;
  caption: string;
  icon: typeof Newspaper;
  tone: keyof typeof KPI_TONES;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-28 min-w-0 items-start justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm transition-[transform,border-color,background-color,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        KPI_TONES[tone].card,
        selected && KPI_TONES[tone].selected,
      )}
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-muted">{label}</span>
        <span className="mt-2 block text-[1.75rem] font-bold leading-none tracking-tight tabular-nums text-foreground">{value.toLocaleString("en-IN")}</span>
        <span className="mt-2.5 block truncate text-xs text-muted">{caption}</span>
      </span>
      <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl", KPI_TONES[tone].icon)}>
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
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize", styles)}>{status}</span>;
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
