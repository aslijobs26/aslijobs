import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  deleteBlogTag,
  fetchBlogTagsAdmin,
  saveBlogTag,
  type BlogTagRecord,
} from "../services/blogs.service";
import { cn } from "../utils/cn";
import { getOperationsApiErrorMessage } from "../utils/operations-api-errors";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function OperationsBlogTagsPage() {
  const [rows, setRows] = useState<BlogTagRecord[]>([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<BlogTagRecord | null>(null);

  async function load() {
    setRows(await fetchBlogTagsAdmin());
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
    setName("");
    setSlug("");
    setSlugTouched(false);
  }

  return (
    <OperationsLayout
      title="Blog tags"
      subtitle="Extra topics an article can match. An article has one category and can have several tags."
    >
      <div className="flex flex-col gap-3">
        <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <p className="text-xs font-semibold text-muted">{rows.length} tags</p>
            <label className="relative block min-w-0 sm:max-w-xs sm:flex-1">
              <span className="sr-only">Search tags</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
              <input className={cn(fieldClass, "pl-8")} placeholder="Search tags" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setError(null);
              closeForm();
              setOpen(true);
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            Add tag
          </button>
        </section>

        {error && !open ? <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-hero-bg/70 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Tag</th>
                  <th className="px-3 py-2.5 font-semibold">Slug</th>
                  <th className="px-3 py-2.5 font-semibold">Articles</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }, (_, index) => (
                      <tr key={index} className="border-t border-border-subtle">
                        <td className="px-3 py-3" colSpan={4}><div className="h-8 animate-pulse rounded-lg bg-hero-bg" /></td>
                      </tr>
                    ))
                  : null}
                {!loading && visible.length === 0 ? (
                  <tr>
                    <td className="px-3 py-14 text-center" colSpan={4}>
                      <p className="text-sm font-semibold text-foreground">No tags found</p>
                      <p className="mt-1 text-xs text-muted">Add a tag or try a different search.</p>
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? visible.map((row) => (
                      <tr key={row.id} className="border-t border-border-subtle hover:bg-hero-bg/50">
                        <td className="px-3 py-2.5 font-semibold text-foreground">{row.name}</td>
                        <td className="px-3 py-2.5 text-muted">{row.slug}</td>
                        <td className="px-3 py-2.5 tabular-nums text-foreground">{row.blogCount}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className={iconButtonClass}
                              aria-label={`Edit ${row.name}`}
                              onClick={() => {
                                setError(null);
                                setEditing(row.id);
                                setName(row.name);
                                setSlug(row.slug);
                                setSlugTouched(true);
                                setOpen(true);
                              }}
                            >
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
            className="grid w-full max-w-md gap-3 rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm"
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => {
              event.preventDefault();
              setSaving(true);
              setError(null);
              void saveBlogTag(editing, { name, slug: slug || slugify(name) || undefined })
                .then(() => {
                  closeForm();
                  return load();
                })
                .catch((err) => setError(getOperationsApiErrorMessage(err, "Could not save the tag.")))
                .finally(() => setSaving(false));
            }}
          >
            <div>
              <h2 className="text-base font-bold text-foreground">{editing ? "Edit tag" : "Add tag"}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">Tags let one article appear under more than one topic.</p>
            </div>
            <label className="grid gap-1.5 text-xs font-semibold text-foreground">
              Name
              <input
                className={fieldClass}
                value={name}
                required
                onChange={(event) => {
                  const next = event.target.value;
                  setName(next);
                  if (!slugTouched) setSlug(slugify(next));
                }}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-foreground">
              Slug
              <input className={fieldClass} value={slug} onChange={(event) => { setSlugTouched(true); setSlug(slugify(event.target.value)); }} />
            </label>
            {error ? <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={closeForm}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create tag"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm" role="dialog" aria-modal="true">
            <h2 className="text-base font-bold text-foreground">Delete this tag?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {pendingDelete.blogCount > 0
                ? `“${pendingDelete.name}” is used by ${pendingDelete.blogCount} ${pendingDelete.blogCount === 1 ? "article" : "articles"}. Remove it from those articles first.`
                : `“${pendingDelete.name}” will be removed from the tag list.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setPendingDelete(null)}>Cancel</button>
              <button
                type="button"
                className="inline-flex h-8 items-center rounded-md bg-danger px-3 text-xs font-semibold text-white disabled:opacity-50"
                disabled={pendingDelete.blogCount > 0}
                onClick={() => {
                  void deleteBlogTag(pendingDelete.id)
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

const fieldClass =
  "h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none placeholder:text-muted hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/25";

const primaryButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-border-subtle bg-white px-3 text-xs font-semibold text-foreground hover:border-primary/30";

const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-hero-bg hover:text-foreground";
