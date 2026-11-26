import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  deleteBlogCategory,
  fetchBlogCategoriesAdmin,
  saveBlogCategory,
  uploadBlogImage,
  type BlogCategoryRecord,
} from "../services/blogs.service";
import { cn } from "../utils/cn";
import { getOperationsApiErrorMessage } from "../utils/operations-api-errors";
import { ArrowUpRight, BookOpen, ImageIcon, Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const EMPTY = { name: "", slug: "", description: "", imageUrl: "", displayOrder: 0, isActive: true };

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function OperationsBlogCategoriesPage() {
  const [rows, setRows] = useState<BlogCategoryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<BlogCategoryRecord | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setRows(await fetchBlogCategoriesAdmin());
  }

  useEffect(() => {
    void load()
      .catch((err) => setError(getOperationsApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(needle) || row.slug.includes(needle));
  }, [rows, query]);
  const activeCount = rows.filter((row) => row.isActive).length;
  const articleCount = rows.reduce((total, row) => total + row.blogCount, 0);

  function closeForm() {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY);
    setSlugTouched(false);
  }

  function startCreate() {
    setError(null);
    setEditing(null);
    setForm(EMPTY);
    setSlugTouched(false);
    setOpen(true);
  }

  function startEdit(row: BlogCategoryRecord) {
    setError(null);
    setEditing(row.id);
    setSlugTouched(true);
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.imageUrl,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await saveBlogCategory(editing, { ...form, slug: form.slug || slugify(form.name) });
      closeForm();
      await load();
    } catch (err) {
      setError(getOperationsApiErrorMessage(err, "Could not save the category."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <OperationsLayout
      title="Blog categories"
      subtitle="Topics visitors use to filter the blogs page. Each article belongs to one category."
    >
      <div className="flex flex-col gap-5 pb-6">
        <section className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.12] via-surface to-surface p-5 shadow-sm sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 -z-10 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-surface/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary shadow-sm">
                <Tags className="size-3.5" aria-hidden="true" /> Editorial workspace
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Build a better reading experience</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Keep your blog organized with clear topics, consistent URLs, and categories readers can browse with confidence.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-muted">
                <span className="inline-flex items-center gap-1.5"><BookOpen className="size-3.5 text-primary" aria-hidden="true" /> {articleCount} articles organized</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" /> {activeCount} active filters</span>
              </div>
            </div>
            <button type="button" className={primaryButtonClass} onClick={startCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Create category
              <ArrowUpRight className="ml-1 size-3.5 opacity-70" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section aria-label="Category overview" className="grid gap-3 sm:grid-cols-3">
          <article className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags className="size-5" aria-hidden="true" /></span>
            <span><span className="block text-[11px] font-semibold text-muted">Total categories</span><span className="mt-0.5 block text-xl font-bold tabular-nums text-foreground">{rows.length}</span></span>
          </article>
          <article className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"><BookOpen className="size-5" aria-hidden="true" /></span>
            <span><span className="block text-[11px] font-semibold text-muted">Articles categorized</span><span className="mt-0.5 block text-xl font-bold tabular-nums text-foreground">{articleCount}</span></span>
          </article>
          <article className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><span className="size-2.5 rounded-full bg-current" /></span>
            <span><span className="block text-[11px] font-semibold text-muted">Active categories</span><span className="mt-0.5 block text-xl font-bold tabular-nums text-foreground">{activeCount}</span></span>
          </article>
        </section>

        {error && !open ? <p role="alert" className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p> : null}

        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 border-b border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h3 className="text-sm font-bold text-foreground">Your categories</h3>
              <p className="mt-1 text-xs text-muted">{loading ? "Loading your editorial topics…" : `${visible.length} ${visible.length === 1 ? "category" : "categories"}${query ? " match your search" : " in your workspace"}`}</p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search categories</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input aria-label="Search categories" className={cn(fieldClass, "h-11 rounded-xl pl-10")} placeholder="Search by name or URL slug" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>

          {loading ? (
            <div className="divide-y divide-border-subtle">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex animate-pulse items-center gap-4 px-4 py-4 sm:px-5">
                  <div className="size-11 shrink-0 rounded-xl bg-hero-bg" />
                  <div className="min-w-0 flex-1 space-y-2"><div className="h-3 w-40 max-w-full rounded bg-hero-bg" /><div className="h-3 w-28 rounded bg-hero-bg" /></div>
                  <div className="hidden h-8 w-16 rounded-lg bg-hero-bg sm:block" />
                  <div className="hidden h-8 w-20 rounded-lg bg-hero-bg sm:block" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Tags className="size-6" aria-hidden="true" /></span>
              <h3 className="mt-4 text-sm font-bold text-foreground">{rows.length === 0 ? "Start with your first category" : "No categories match that search"}</h3>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">{rows.length === 0 ? "Create a topic to help readers discover related articles." : "Try a different name or URL slug, or clear your search."}</p>
              {rows.length === 0 ? <button type="button" className={`${primaryButtonClass} mt-5`} onClick={startCreate}><Plus className="size-4" aria-hidden="true" /> Create category</button> : null}
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              <div className="hidden grid-cols-[minmax(0,1fr)_100px_125px_100px_96px] items-center gap-4 bg-hero-bg/50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted lg:grid">
                <span>Category</span>
                <span>Articles</span>
                <span>Display order</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {visible.map((row) => (
                <article key={row.id} className="group grid grid-cols-2 items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors duration-200 hover:bg-primary/[0.025] sm:px-5 lg:grid-cols-[minmax(0,1fr)_100px_125px_100px_96px] lg:gap-4">
                  <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-primary/[0.06] text-primary">
                      {row.imageUrl ? <img src={row.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-5" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-foreground">{row.name}</span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-muted">/{row.slug}</span>
                      {row.description ? <span className="mt-1 hidden max-w-xl truncate text-xs text-muted sm:block">{row.description}</span> : null}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">Articles</span>
                    <span className="text-sm font-bold tabular-nums text-foreground">{row.blogCount}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">Display order</span>
                    <span className="text-sm font-bold tabular-nums text-foreground">{String(row.displayOrder).padStart(2, "0")}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">Status</span>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold", row.isActive ? "border-success/15 bg-success/10 text-success" : "border-border-subtle bg-hero-bg text-muted")}>
                      <span className={cn("size-1.5 rounded-full", row.isActive ? "bg-success" : "bg-muted/50")} />
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3 lg:col-span-1 lg:justify-end">
                    <span className="text-[10px] font-medium text-muted lg:hidden">Manage category</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" className={cn(iconButtonClass, "size-9 rounded-xl border border-transparent transition-colors hover:border-primary/20 hover:bg-primary/[0.06] hover:text-primary")} aria-label={`Edit ${row.name}`} onClick={() => startEdit(row)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" className={cn(iconButtonClass, "size-9 rounded-xl border border-transparent text-muted transition-colors hover:border-danger/15 hover:bg-danger/5 hover:text-danger")} aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            className="grid max-h-[min(90dvh,42rem)] w-full max-w-xl gap-4 overflow-y-auto rounded-3xl border border-border-subtle bg-surface p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags className="size-5" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h2 id="category-form-title" className="text-base font-bold text-foreground">{editing ? "Edit category" : "Create a category"}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted">Set up a clear topic for your readers.</p>
                </div>
              </div>
              <button type="button" aria-label="Close category form" onClick={closeForm} className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-hero-bg hover:text-foreground">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <Field label="Name">
              <input
                className={fieldClass}
                placeholder="Job Search"
                value={form.name}
                required
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));
                }}
              />
            </Field>
            <Field label="URL slug">
              <input className={fieldClass} value={form.slug} onChange={(event) => { setSlugTouched(true); setForm({ ...form, slug: slugify(event.target.value) }); }} />
            </Field>
            <Field label="Description" hint="Optional">
              <textarea className={cn(fieldClass, "h-auto resize-y py-2")} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <Field label="Image" hint="Optional">
              <div className="flex items-center gap-3">
                <span className="inline-flex aspect-[16/10] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-hero-bg text-muted">
                  {form.imageUrl ? <img src={form.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4" aria-hidden />}
                </span>
                <button type="button" className={secondaryButtonClass} onClick={() => fileRef.current?.click()}>{form.imageUrl ? "Replace" : "Upload"}</button>
                <input
                  ref={fileRef}
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    void uploadBlogImage(file, "cover")
                      .then((image) => setForm((current) => ({ ...current, imageUrl: image.url })))
                      .catch((err) => setError(getOperationsApiErrorMessage(err, "Image upload failed.")));
                  }}
                />
              </div>
            </Field>
            <Field label="Display order">
              <input className={fieldClass} type="number" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })} />
            </Field>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-hero-bg/60 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">Active on the public filters</span>
              <input type="checkbox" className="size-4 accent-primary" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            </label>
            {error ? <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
              <button type="button" className={secondaryButtonClass} onClick={closeForm}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create category"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-surface p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true">
            <span className="flex size-11 items-center justify-center rounded-xl bg-danger/10 text-danger"><Trash2 className="size-5" aria-hidden="true" /></span>
            <h2 className="mt-4 text-base font-bold text-foreground">Delete this category?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {pendingDelete.blogCount > 0
                ? `“${pendingDelete.name}” is used by ${pendingDelete.blogCount} ${pendingDelete.blogCount === 1 ? "article" : "articles"}. Move those articles before deleting it.`
                : `“${pendingDelete.name}” will be removed. Articles will no longer be able to use this filter.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setPendingDelete(null)}>Cancel</button>
              <button
                type="button"
                className="inline-flex h-8 items-center rounded-md bg-danger px-3 text-xs font-semibold text-white disabled:opacity-50"
                disabled={pendingDelete.blogCount > 0}
                onClick={() => {
                  void deleteBlogCategory(pendingDelete.id)
                    .then(() => {
                      setPendingDelete(null);
                      return load();
                    })
                    .catch((err) => {
                      setPendingDelete(null);
                      setError(getOperationsApiErrorMessage(err));
                    });
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

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 text-xs font-semibold text-foreground">
      <span className="flex items-center justify-between gap-2">
        {label}
        {hint ? <span className="font-medium text-muted">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl border border-border-subtle bg-surface px-3.5 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-muted hover:border-primary/25 focus:border-primary focus:ring-2 focus:ring-primary/20";

const primaryButtonClass =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-white shadow-md shadow-primary/20 transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-hero-bg hover:text-foreground";
