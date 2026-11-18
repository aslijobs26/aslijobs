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
import { ImageIcon, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
      <div className="flex flex-col gap-3">
        <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <p className="text-xs font-semibold text-muted">{rows.length} categories</p>
            <label className="relative block min-w-0 sm:max-w-xs sm:flex-1">
              <span className="sr-only">Search categories</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
              <input className={cn(fieldClass, "pl-8")} placeholder="Search categories" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          <button type="button" className={primaryButtonClass} onClick={startCreate}>
            <Plus className="size-3.5" aria-hidden />
            Add category
          </button>
        </section>

        {error && !open ? <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-hero-bg/70 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Category</th>
                  <th className="px-3 py-2.5 font-semibold">Slug</th>
                  <th className="px-3 py-2.5 font-semibold">Articles</th>
                  <th className="px-3 py-2.5 font-semibold">Order</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }, (_, index) => (
                      <tr key={index} className="border-t border-border-subtle">
                        <td className="px-3 py-3" colSpan={6}><div className="h-8 animate-pulse rounded-lg bg-hero-bg" /></td>
                      </tr>
                    ))
                  : null}
                {!loading && visible.length === 0 ? (
                  <tr>
                    <td className="px-3 py-14 text-center" colSpan={6}>
                      <p className="text-sm font-semibold text-foreground">No categories found</p>
                      <p className="mt-1 text-xs text-muted">Add a category or try a different search.</p>
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? visible.map((row) => (
                      <tr key={row.id} className="border-t border-border-subtle hover:bg-hero-bg/50">
                        <td className="px-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-hero-bg text-primary">
                              {row.imageUrl ? <img src={row.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-3.5" aria-hidden />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-foreground">{row.name}</span>
                              {row.description ? <span className="block truncate text-xs text-muted">{row.description}</span> : null}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted">{row.slug}</td>
                        <td className="px-3 py-2.5 tabular-nums text-foreground">{row.blogCount}</td>
                        <td className="px-3 py-2.5 tabular-nums text-muted">{row.displayOrder}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", row.isActive ? "bg-success/15 text-success" : "bg-hero-bg text-muted")}>
                            {row.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1">
                            <button type="button" className={iconButtonClass} aria-label={`Edit ${row.name}`} onClick={() => startEdit(row)}>
                              <Pencil className="size-3.5" aria-hidden />
                            </button>
                            <button type="button" className={cn(iconButtonClass, "text-danger hover:bg-danger/10")} aria-label={`Delete ${row.name}`} onClick={() => setPendingDelete(row)}>
                              <Trash2 className="size-3.5" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <form
            className="grid max-h-[min(90dvh,40rem)] w-full max-w-lg gap-3 overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div>
              <h2 id="category-form-title" className="text-base font-bold text-foreground">{editing ? "Edit category" : "Add category"}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">The name is the public filter. The slug is the address, such as job-search.</p>
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
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-hero-bg/60 px-3 py-2.5">
              <span className="text-sm font-semibold text-foreground">Active on the public filters</span>
              <input type="checkbox" className="size-4 accent-primary" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            </label>
            {error ? <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={closeForm}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create category"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm" role="dialog" aria-modal="true">
            <h2 className="text-base font-bold text-foreground">Delete this category?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {pendingDelete.blogCount > 0
                ? `“${pendingDelete.name}” is used by ${pendingDelete.blogCount} ${pendingDelete.blogCount === 1 ? "article" : "articles"}. Move those articles before deleting it.`
                : `“${pendingDelete.name}” will be removed. Articles will no longer be able to use this filter.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
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
  "h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none placeholder:text-muted hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/25";

const primaryButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-border-subtle bg-white px-3 text-xs font-semibold text-foreground hover:border-primary/30";

const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-hero-bg hover:text-foreground";
