import { CircleHelp, ImageIcon, Newspaper, PenLine, Plus, Search, Trash2, X } from "lucide-react";
import { BlogLivePreview } from "./BlogLivePreview";
import { BlogRichTextEditor } from "./BlogRichTextEditor";
import { OperationsLayout } from "../layout/OperationsLayout";
import {
  fetchAdminBlog,
  fetchBlogCategoriesAdmin,
  fetchBlogTagsAdmin,
  openSiteBlogPreview,
  saveAdminBlog,
  saveBlogTag,
  uploadBlogImage,
  type BlogCategoryRecord,
  type BlogImage,
  type BlogTagRecord,
} from "../../../services/blogs.service";
import { cn } from "../../../utils/cn";
import { getOperationsApiErrorMessage, getOperationsApiFieldErrors } from "../../../utils/operations-api-errors";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";

type EditorState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tagIds: string[];
  tagText: string;
  authorName: string;
  coverImage: BlogImage | null;
  coverImageAlt: string;
  authorImage: BlogImage | null;
  isFeatured: boolean;
  allowIndexing: boolean;
  status: "draft" | "published" | "scheduled";
  scheduledAt: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: BlogImage | null;
  faqs: { question: string; answer: string }[];
  relatedBlogIds: string;
};

const EMPTY: EditorState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  categoryId: "",
  tagIds: [],
  tagText: "",
  authorName: "AsliJobs",
  coverImage: null,
  coverImageAlt: "",
  authorImage: null,
  isFeatured: false,
  allowIndexing: true,
  status: "draft",
  scheduledAt: "",
  seoTitle: "",
  seoDescription: "",
  focusKeyword: "",
  keywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: null,
  faqs: [],
  relatedBlogIds: "",
};

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function saveNotice(status: EditorState["status"], saved: { status: EditorState["status"]; scheduledAt: string | null }) {
  if (saved.status === "scheduled" && saved.scheduledAt) {
    return `Scheduled for ${new Date(saved.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`;
  }
  if (saved.status === "published") return status === "draft" ? "Draft was already live, so it stayed published." : "Published.";
  return "Draft saved.";
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function displayImageUrl(url: string, width = 800) {
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  return `${url.slice(0, index + marker.length)}f_auto,q_auto,w_${width}/${url.slice(index + marker.length)}`;
}

function croppedImageUrl(url: string, width: number, height: number) {
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  return `${url.slice(0, index + marker.length)}c_fill,g_auto,w_${width},h_${height},f_auto,q_auto/${url.slice(index + marker.length)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toPayload(state: EditorState, status: EditorState["status"]) {
  return {
    title: state.title,
    slug: state.slug || undefined,
    excerpt: state.excerpt,
    content: state.content,
    coverImage: state.coverImage,
    coverImageAlt: state.coverImageAlt,
    categoryId: state.categoryId,
    tagIds: state.tagIds,
    authorName: state.authorName,
    authorImage: state.authorImage,
    isFeatured: state.isFeatured,
    allowIndexing: state.allowIndexing,
    status,
    scheduledAt: state.scheduledAt ? new Date(state.scheduledAt).toISOString() : null,
    seo: {
      title: state.seoTitle,
      description: state.seoDescription,
      focusKeyword: state.focusKeyword,
      keywords: state.keywords.split(",").map((item) => item.trim()).filter(Boolean),
      canonicalUrl: state.canonicalUrl,
      ogTitle: state.ogTitle,
      ogDescription: state.ogDescription,
      ogImage: state.ogImage,
    },
    faqs: state.faqs
      .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
      .filter((item) => item.question && item.answer),
    relatedBlogIds: state.relatedBlogIds.split(",").map((item) => item.trim()).filter(Boolean),
  };
}

export function BlogEditorPage({ blogId }: { blogId?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<EditorState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [categories, setCategories] = useState<BlogCategoryRecord[]>([]);
  const [tags, setTags] = useState<BlogTagRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState<EditorState["status"] | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    void Promise.all([fetchBlogCategoriesAdmin(), fetchBlogTagsAdmin()]).then(([nextCategories, nextTags]) => {
      setCategories(nextCategories.filter((item) => item.isActive));
      setTags(nextTags);
    });
  }, []);

  useEffect(() => {
    if (!blogId) return;
    void fetchAdminBlog(blogId).then((blog) => {
      setSlugTouched(true);
      dirtyRef.current = false;
      setState({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        categoryId: blog.category.id,
        tagIds: blog.tagIds,
        tagText: blog.tags.map((tag) => tag.name).join(", "),
        authorName: blog.authorName,
        coverImage: blog.coverImage,
        coverImageAlt: blog.coverImage?.alt ?? "",
        authorImage: blog.authorImage,
        isFeatured: blog.isFeatured,
        allowIndexing: blog.allowIndexing,
        status: blog.status,
        scheduledAt: toLocalInput(blog.scheduledAt),
        seoTitle: blog.seo.title ?? "",
        seoDescription: blog.seo.description ?? "",
        focusKeyword: blog.seo.focusKeyword ?? "",
        keywords: (blog.seo.keywords ?? []).join(", "),
        canonicalUrl: blog.seo.canonicalUrl ?? "",
        ogTitle: blog.seo.ogTitle ?? "",
        ogDescription: blog.seo.ogDescription ?? "",
        ogImage: blog.seo.ogImage ?? null,
        faqs: blog.faqs ?? [],
        relatedBlogIds: blog.relatedBlogIds.join(", "),
      });
    }).catch((err) => setError(getOperationsApiErrorMessage(err, "Could not load this blog.")));
  }, [blogId]);

  useEffect(() => {
    const incoming = (location.state as { notice?: string } | null)?.notice;
    if (!incoming) return;
    setNotice(incoming);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  function patch(partial: Partial<EditorState>) {
    dirtyRef.current = true;
    setNotice(null);
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(partial)) {
        delete next[key === "tagIds" ? "tagText" : key];
      }
      return next;
    });
    setState((current) => {
      const next = { ...current, ...partial };
      if (partial.title !== undefined && !slugTouched) {
        next.slug = slugify(partial.title);
      }
      return next;
    });
  }

  async function resolveTagIds(value: string, known: BlogTagRecord[]) {
    const names = [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
    if (names.length > 12) throw new Error("Use up to 12 tags.");
    const next = [...known];
    const ids: string[] = [];
    for (const name of names) {
      const match = next.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
      if (match) {
        ids.push(match.id);
        continue;
      }
      const created = (await saveBlogTag(null, { name })) as BlogTagRecord;
      next.push(created);
      ids.push(created.id);
    }
    setTags(next);
    return ids;
  }

  async function upload(file: File, purpose: "cover" | "inline" | "author" | "social") {
    if (!["image/png", "image/jpeg", "image/webp", "image/jpg"].includes(file.type)) {
      throw new Error("Use a PNG, JPG, or WEBP image.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image must be 5 MB or smaller.");
    }
    return uploadBlogImage(file, purpose);
  }

  function readyToSave(status: EditorState["status"]) {
    return blogFieldProblems(state, status);
  }

  function showFieldErrors(errors: Record<string, string>, formMessage: string | null = null) {
    setNotice(null);
    setFieldErrors(errors);
    setError(formMessage);
    const first = BLOG_FIELD_ORDER.find((field) => errors[field]);
    if (!first) return;
    const node = document.querySelector(`[data-blog-field="${first}"]`);
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
    const focusable = node?.querySelector("input, textarea, select");
    if (focusable instanceof HTMLElement) focusable.focus();
  }

  async function save(status: EditorState["status"]) {
    const problems = readyToSave(status);
    if (Object.keys(problems).length > 0) {
      showFieldErrors(problems);
      return;
    }
    setSaving(status);
    setError(null);
    setFieldErrors({});
    setNotice(null);
    try {
      let tagIds: string[];
      try {
        tagIds = await resolveTagIds(state.tagText, tags);
      } catch (err) {
        const tagError = getOperationsApiFieldErrors(err).name || getOperationsApiErrorMessage(err, "Could not save the tags.");
        showFieldErrors({ tagText: humanBlogError("tagIds", tagError) });
        return;
      }
      const saved = await saveAdminBlog(blogId ?? null, toPayload({ ...state, tagIds }, status));
      const message = saveNotice(status, saved);
      dirtyRef.current = false;
      setState((current) => ({
        ...current,
        slug: saved.slug,
        status: saved.status,
        scheduledAt: toLocalInput(saved.scheduledAt),
        tagIds: saved.tagIds,
        tagText: saved.tags.map((tag) => tag.name).join(", "),
      }));
      if (!blogId) {
        navigate(`${OPERATIONS_ROUTES.BLOGS}/${saved.id}/edit`, { replace: true, state: { notice: message } });
      } else {
        setNotice(message);
      }
    } catch (err) {
      const mapped = mapBlogApiFieldErrors(getOperationsApiFieldErrors(err));
      if (Object.keys(mapped.fields).length > 0) {
        showFieldErrors(mapped.fields, mapped.form);
      } else {
        setFieldErrors({});
        setError(getOperationsApiErrorMessage(err, "Unable to save the blog. Please check the form fields and try again."));
      }
    } finally {
      setSaving(null);
    }
  }

  function cancel() {
    if (dirtyRef.current && !window.confirm("Leave this article? Unsaved changes will be lost.")) return;
    navigate(OPERATIONS_ROUTES.BLOGS);
  }

  const categoryName = categories.find((item) => item.id === state.categoryId)?.name ?? "";
  const previewHeadings = headingsFromHtml(state.content);

  return (
    <OperationsLayout title={blogId ? "Edit blog" : "Create blog"} subtitle="The preview on the right matches the public article.">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
        <div className="flex min-w-0 flex-col gap-4">
        {error ? <p className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <header className="flex items-start gap-2.5 border-b border-border-subtle bg-hero-bg/40 px-4 py-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Newspaper className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold tracking-tight text-foreground">Basic information</h2>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">Title, category, and the images shown on the article.</p>
            </div>
          </header>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Title" field="title" error={fieldErrors.title}>
              <input className={cn(inputClass, fieldErrors.title && invalidControl)} maxLength={180} value={state.title} placeholder="Article title" aria-invalid={Boolean(fieldErrors.title)} onChange={(event) => patch({ title: event.target.value })} />
            </Field>
            <Field className="sm:col-span-2" label="Short description" hint={`${state.excerpt.length}/400`} field="excerpt" error={fieldErrors.excerpt}>
              <textarea className={cn(textareaClass, fieldErrors.excerpt && invalidControl)} rows={3} maxLength={400} placeholder="One or two sentences for the article card" value={state.excerpt} aria-invalid={Boolean(fieldErrors.excerpt)} onChange={(event) => patch({ excerpt: event.target.value })} />
            </Field>
            <Field label="Category" field="categoryId" error={fieldErrors.categoryId}>
              <select className={cn(inputClass, fieldErrors.categoryId && invalidControl)} value={state.categoryId} aria-invalid={Boolean(fieldErrors.categoryId)} onChange={(event) => patch({ categoryId: event.target.value })}>
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Author name" field="authorName" error={fieldErrors.authorName}>
              <input className={cn(inputClass, fieldErrors.authorName && invalidControl)} maxLength={80} value={state.authorName} aria-invalid={Boolean(fieldErrors.authorName)} onChange={(event) => patch({ authorName: event.target.value })} />
            </Field>
            <Field className="sm:col-span-2" label="Tags" hint="Separate with commas. Each tag can be 40 characters." field="tagText" error={fieldErrors.tagText}>
              <input
                className={cn(inputClass, fieldErrors.tagText && invalidControl)}
                placeholder="Delivery, Drivers, Warehouse"
                value={state.tagText}
                aria-invalid={Boolean(fieldErrors.tagText)}
                onChange={(event) => patch({ tagText: event.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 items-start gap-3 border-t border-border-subtle pt-4 sm:col-span-2">
              <MediaSlot
                label="Author photo"
                square
                image={state.authorImage}
                onPick={async (file) => patch({ authorImage: await upload(file, "author") })}
                onRemove={() => patch({ authorImage: null })}
              />
              <div data-blog-field="coverImage" className="grid gap-1.5">
                <MediaSlot
                  label="Cover image"
                  required
                  cover
                  image={state.coverImage}
                  onPick={async (file) => patch({ coverImage: await upload(file, "cover") })}
                  onRemove={() => patch({ coverImage: null })}
                />
                {fieldErrors.coverImage ? <p className="text-[11px] font-medium text-danger" role="alert">{fieldErrors.coverImage}</p> : null}
              </div>
              <Field label="Cover image description" field="coverImageAlt" error={fieldErrors.coverImageAlt}>
                <input className={cn(inputClass, fieldErrors.coverImageAlt && invalidControl)} maxLength={180} placeholder="Describe the cover for screen readers" value={state.coverImageAlt} aria-invalid={Boolean(fieldErrors.coverImageAlt)} onChange={(event) => patch({ coverImageAlt: event.target.value })} />
              </Field>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5 sm:col-span-2">
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-foreground">Featured article</span>
                <span className="mt-0.5 block text-[11px] font-medium leading-snug text-muted">Show this article in the featured spot on the blogs page.</span>
              </span>
              <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${state.isFeatured ? "bg-primary" : "bg-border"}`}>
                <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${state.isFeatured ? "translate-x-4" : "translate-x-0.5"}`} />
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={state.isFeatured}
                onChange={(event) => patch({ isFeatured: event.target.checked })}
              />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <header className="flex items-start gap-2.5 border-b border-border-subtle bg-hero-bg/40 px-4 py-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PenLine className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold tracking-tight text-foreground">Article</h2>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">Write the story. Headings, images, and YouTube links appear in the preview.</p>
            </div>
          </header>
          <div className="p-3" data-blog-field="content">
            <BlogRichTextEditor
              value={state.content}
              onChange={(content) => patch({ content })}
              onUploadImage={async (file) => (await upload(file, "inline")).url}
            />
            {fieldErrors.content ? <p className="px-1 pt-2 text-[11px] font-medium text-danger" role="alert">{fieldErrors.content}</p> : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm" data-blog-field="faqs">
          <header className="flex items-start justify-between gap-3 border-b border-border-subtle bg-hero-bg/40 px-4 py-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CircleHelp className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[13px] font-semibold tracking-tight text-foreground">Frequently asked questions</h2>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">Shown under the article on the site and in the preview. Up to 8.</p>
              </div>
            </div>
            <button
              type="button"
              className={`${secondaryButtonClass} h-8 shrink-0 gap-1.5`}
              disabled={state.faqs.length >= 8}
              onClick={() => patch({ faqs: [...state.faqs, { question: "", answer: "" }] })}
            >
              <Plus className="size-3.5" aria-hidden />
              Add
            </button>
          </header>
          <div className="grid gap-3 p-4">
            {fieldErrors.faqs ? <p className="text-[11px] font-medium text-danger" role="alert">{fieldErrors.faqs}</p> : null}
            {state.faqs.length === 0 ? (
              <p className="text-xs text-muted">No questions yet. Add the questions readers ask about this article.</p>
            ) : null}
            {state.faqs.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-border-subtle bg-hero-bg/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Question {index + 1}</p>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-md text-danger hover:bg-danger/10"
                    aria-label={`Remove question ${index + 1}`}
                    onClick={() => patch({ faqs: state.faqs.filter((_, itemIndex) => itemIndex !== index) })}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
                <input
                  className={inputClass}
                  placeholder="What should a reader know?"
                  maxLength={180}
                  value={item.question}
                  onChange={(event) => {
                    const faqs = state.faqs.map((entry, itemIndex) =>
                      itemIndex === index ? { ...entry, question: event.target.value } : entry,
                    );
                    patch({ faqs });
                  }}
                />
                <textarea
                  className={textareaClass}
                  rows={2}
                  placeholder="Short answer"
                  maxLength={800}
                  value={item.answer}
                  onChange={(event) => {
                    const faqs = state.faqs.map((entry, itemIndex) =>
                      itemIndex === index ? { ...entry, answer: event.target.value } : entry,
                    );
                    patch({ faqs });
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <header className="flex items-start gap-2.5 border-b border-border-subtle bg-hero-bg/40 px-4 py-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold tracking-tight text-foreground">SEO</h2>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">How this article appears in Google and when the link is shared.</p>
            </div>
          </header>
          <div className="grid gap-4 p-4">
            <div className="rounded-lg border border-border-subtle bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Search preview</p>
              <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-primary">
                {state.seoTitle.trim() || state.title.trim() || "Article title"}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-muted">aslijobs.com/blogs/{state.slug || "article-slug"}</p>
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-foreground/80">
                {state.seoDescription.trim() || state.excerpt.trim() || "The meta description appears here."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2" label="URL slug" hint={state.slug ? "Public address" : "Filled from the title until you edit it."} field="slug" error={fieldErrors.slug}>
                <div className={cn("flex h-10 overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20", fieldErrors.slug && "border-danger focus-within:border-danger focus-within:ring-danger/20")}>
                  <span className="inline-flex shrink-0 items-center border-r border-border-subtle bg-hero-bg/70 px-2.5 text-xs font-medium text-muted">/blogs/</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted"
                    value={state.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      patch({ slug: slugify(event.target.value) });
                    }}
                  />
                </div>
              </Field>
              <Field className="sm:col-span-2" label="SEO title" hint={state.seoTitle ? `${state.seoTitle.length}/70` : "Uses the article title"} field="seoTitle" error={fieldErrors.seoTitle}>
                <input className={cn(inputClass, fieldErrors.seoTitle && invalidControl)} value={state.seoTitle} maxLength={70} placeholder={state.title || "Headline shown in Google"} aria-invalid={Boolean(fieldErrors.seoTitle)} onChange={(event) => patch({ seoTitle: event.target.value })} />
              </Field>
              <Field className="sm:col-span-2" label="Meta description" hint={state.seoDescription ? `${state.seoDescription.length}/180` : "Uses the short description"} field="seoDescription" error={fieldErrors.seoDescription}>
                <textarea className={cn(textareaClass, fieldErrors.seoDescription && invalidControl)} rows={3} maxLength={180} placeholder={state.excerpt || "Short text under the Google headline"} value={state.seoDescription} aria-invalid={Boolean(fieldErrors.seoDescription)} onChange={(event) => patch({ seoDescription: event.target.value })} />
              </Field>
              <Field label="Focus keyword" field="focusKeyword" error={fieldErrors.focusKeyword}>
                <input className={cn(inputClass, fieldErrors.focusKeyword && invalidControl)} maxLength={80} value={state.focusKeyword} placeholder="Main phrase to rank for" aria-invalid={Boolean(fieldErrors.focusKeyword)} onChange={(event) => patch({ focusKeyword: event.target.value })} />
              </Field>
              <Field label="Keywords" hint="Separate with commas. Each keyword can be 40 characters." field="keywords" error={fieldErrors.keywords}>
                <input className={cn(inputClass, fieldErrors.keywords && invalidControl)} value={state.keywords} placeholder="Related phrases" aria-invalid={Boolean(fieldErrors.keywords)} onChange={(event) => patch({ keywords: event.target.value })} />
              </Field>
            </div>

            <div className="grid gap-4 border-t border-border-subtle pt-4 sm:grid-cols-2">
              <Field className="sm:col-span-2" label="Share title" hint="Uses the SEO title when empty" field="ogTitle" error={fieldErrors.ogTitle}>
                <input className={cn(inputClass, fieldErrors.ogTitle && invalidControl)} maxLength={90} value={state.ogTitle} placeholder={state.seoTitle || state.title || "Title on WhatsApp and LinkedIn"} aria-invalid={Boolean(fieldErrors.ogTitle)} onChange={(event) => patch({ ogTitle: event.target.value })} />
              </Field>
              <Field className="sm:col-span-2" label="Share description" hint="Uses the meta description when empty" field="ogDescription" error={fieldErrors.ogDescription}>
                <textarea className={cn(textareaClass, fieldErrors.ogDescription && invalidControl)} maxLength={200} rows={2} value={state.ogDescription} placeholder={state.seoDescription || state.excerpt || "Text beside the shared image"} aria-invalid={Boolean(fieldErrors.ogDescription)} onChange={(event) => patch({ ogDescription: event.target.value })} />
              </Field>
              <div className="sm:col-span-2">
              <ImageField
                label="Social image"
                image={state.ogImage}
                onPick={async (file) => patch({ ogImage: await upload(file, "social") })}
                onRemove={() => patch({ ogImage: null })}
              />
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <SectionHeading title="Publishing" hint="Choose when the article goes live and which articles it links to." />
          <div className="grid gap-4">
            <ToggleRow
              checked={state.allowIndexing}
              title="Allow search engines"
              hint="Turn this off to keep the article out of Google."
              onChange={(checked) => patch({ allowIndexing: checked })}
            />
            <Field label="Schedule" hint="Leave empty to publish immediately." stackHint field="scheduledAt" error={fieldErrors.scheduledAt}>
              <input className={cn(inputClass, fieldErrors.scheduledAt && invalidControl)} type="datetime-local" value={state.scheduledAt} aria-invalid={Boolean(fieldErrors.scheduledAt)} onChange={(event) => patch({ scheduledAt: event.target.value, status: "scheduled" })} />
            </Field>
            <Field label="Related articles" hint="Paste article ids, separated by commas." stackHint field="relatedBlogIds" error={fieldErrors.relatedBlogIds}>
              <input className={cn(inputClass, fieldErrors.relatedBlogIds && invalidControl)} value={state.relatedBlogIds} placeholder="Article ids" aria-invalid={Boolean(fieldErrors.relatedBlogIds)} onChange={(event) => patch({ relatedBlogIds: event.target.value })} />
            </Field>
          </div>
        </section>

        <div className="sticky bottom-2 z-10 flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface/95 p-2 shadow-sm backdrop-blur">
          {error ? <p className="px-1 text-sm text-danger">{error}</p> : null}
          {notice ? <p className="px-1 text-sm font-medium text-primary">{notice}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={saving !== null} className={primaryButtonClass} onClick={() => void save("published")}>
            {saving === "published" ? "Publishing…" : state.status === "published" ? "Update" : "Publish"}
          </button>
          <button type="button" disabled={saving !== null} className={secondaryButtonClass} onClick={() => void save("draft")}>
            {saving === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" disabled={saving !== null} className={secondaryButtonClass} onClick={() => void save("scheduled")}>
            {saving === "scheduled" ? "Scheduling…" : "Schedule"}
          </button>
          {blogId ? (
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => {
                if (
                  dirtyRef.current &&
                  !window.confirm("Preview opens the last saved version. Save first if these edits should be included.")
                ) {
                  return;
                }
                void openSiteBlogPreview(blogId).catch((err) => {
                  setError(getOperationsApiErrorMessage(err, "Preview unavailable."));
                });
              }}
            >
              Preview
            </button>
          ) : null}
          {blogId ? (
            <span className="text-xs font-semibold text-muted">
              {state.status === "published" ? "Published" : state.status === "scheduled" ? "Scheduled" : "Draft"}
            </span>
          ) : null}
          <button type="button" disabled={saving !== null} className={`${secondaryButtonClass} ml-auto`} onClick={cancel}>Cancel</button>
          </div>
        </div>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-2 lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto">
        <BlogLivePreview
            title={state.title}
            excerpt={state.excerpt}
            content={state.content}
            categoryName={categoryName}
            authorName={state.authorName}
            authorImageUrl={state.authorImage?.url ?? ""}
            coverImageUrl={state.coverImage?.url ?? ""}
            coverImageAlt={state.coverImageAlt || state.title}
            readingTimeMinutes={readingMinutes(state.content)}
            headings={previewHeadings}
            faqs={state.faqs.filter((item) => item.question.trim() && item.answer.trim())}
          />
        </aside>
      </div>
    </OperationsLayout>
  );
}

function readingMinutes(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 1;
  return Math.max(1, Math.ceil(text.split(" ").filter(Boolean).length / 200));
}

function headingsFromHtml(html: string) {
  if (!html.trim() || typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll("h2, h3")]
    .map((node, index) => ({
      id: node.id || `heading-${index}`,
      text: (node.textContent ?? "").replace(/\s+/g, " ").trim(),
      level: (node.tagName === "H2" ? 2 : 3) as 2 | 3,
    }))
    .filter((item) => item.text);
}

const BLOG_FIELD_ORDER = [
  "title",
  "excerpt",
  "categoryId",
  "authorName",
  "tagText",
  "coverImage",
  "coverImageAlt",
  "content",
  "faqs",
  "slug",
  "seoTitle",
  "seoDescription",
  "focusKeyword",
  "keywords",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "scheduledAt",
  "relatedBlogIds",
] as const;

const BLOG_API_FIELDS: { path: string; field: string }[] = [
  { path: "seo.keywords", field: "keywords" },
  { path: "seo.title", field: "seoTitle" },
  { path: "seo.description", field: "seoDescription" },
  { path: "seo.focusKeyword", field: "focusKeyword" },
  { path: "seo.ogTitle", field: "ogTitle" },
  { path: "seo.ogDescription", field: "ogDescription" },
  { path: "seo.ogImage", field: "ogImage" },
  { path: "coverImageAlt", field: "coverImageAlt" },
  { path: "coverImage", field: "coverImage" },
  { path: "authorImage", field: "authorImage" },
  { path: "authorName", field: "authorName" },
  { path: "categoryId", field: "categoryId" },
  { path: "relatedBlogIds", field: "relatedBlogIds" },
  { path: "tagIds", field: "tagText" },
  { path: "scheduledAt", field: "scheduledAt" },
  { path: "content", field: "content" },
  { path: "excerpt", field: "excerpt" },
  { path: "title", field: "title" },
  { path: "slug", field: "slug" },
  { path: "faqs", field: "faqs" },
  { path: "name", field: "tagText" },
];

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function limitMessage(message: string, label: string) {
  const characters = message.match(/<=(\d+) characters/);
  if (characters) return `${label} must be ${characters[1]} characters or fewer.`;
  const items = message.match(/<=(\d+)/);
  if (items && /array|items|element/i.test(message)) return `Use ${items[1]} or fewer.`;
  if (/expected string to have >=1|required/i.test(message)) return `${label} is required.`;
  return message;
}

function humanBlogError(path: string, message: string) {
  if (path === "tagIds" || path.startsWith("tagIds.") || path === "name") {
    return limitMessage(message, "Each tag");
  }
  if (path.startsWith("seo.keywords")) return limitMessage(message, "Each keyword");
  if (path.startsWith("relatedBlogIds")) return /invalid id/i.test(message) ? "Related articles must be article ids, separated by commas." : limitMessage(message, "Related articles");
  if (path.startsWith("faqs")) return limitMessage(message, "This answer");
  if (path.startsWith("categoryId")) return "Choose a category.";
  if (path.startsWith("slug")) return "Use a lowercase slug with hyphens, up to 80 characters.";
  const labels: Record<string, string> = {
    title: "Title",
    excerpt: "Short description",
    content: "Article",
    coverImage: "Cover image",
    coverImageAlt: "Cover image description",
    authorName: "Author name",
    seoTitle: "SEO title",
    seoDescription: "Meta description",
    focusKeyword: "Focus keyword",
    ogTitle: "Share title",
    ogDescription: "Share description",
    scheduledAt: "Schedule",
  };
  const field = BLOG_API_FIELDS.find((item) => path === item.path || path.startsWith(`${item.path}.`))?.field ?? "";
  return limitMessage(message, labels[field] ?? "This field");
}

function mapBlogApiFieldErrors(raw: Record<string, string>) {
  const fields: Record<string, string> = {};
  const leftover: string[] = [];
  for (const [path, message] of Object.entries(raw)) {
    const match = BLOG_API_FIELDS.find((item) => path === item.path || path.startsWith(`${item.path}.`));
    const text = humanBlogError(path, message);
    if (!match) leftover.push(text);
    else if (!fields[match.field]) fields[match.field] = text;
  }
  return { fields, form: leftover[0] ?? null };
}

function blogFieldProblems(state: EditorState, status: EditorState["status"]) {
  const errors: Record<string, string> = {};
  const title = state.title.trim();
  const excerpt = state.excerpt.trim();
  if (!title) errors.title = "Title is required.";
  else if (title.length > 180) errors.title = "Title must be 180 characters or fewer.";
  if (!excerpt) errors.excerpt = "Short description is required.";
  else if (excerpt.length > 400) errors.excerpt = "Short description must be 400 characters or fewer.";
  if (!/^[a-f\d]{24}$/i.test(state.categoryId)) errors.categoryId = "Choose a category.";
  if (state.authorName.trim().length > 80) errors.authorName = "Author name must be 80 characters or fewer.";
  const tags = splitList(state.tagText);
  if (tags.length > 12) errors.tagText = "Use up to 12 tags.";
  else if (tags.some((tag) => tag.length > 40)) errors.tagText = "Each tag must be 40 characters or fewer.";
  if (!state.coverImage?.url) errors.coverImage = "Cover image is required.";
  if (state.coverImageAlt.trim().length > 180) errors.coverImageAlt = "Cover image description must be 180 characters or fewer.";
  if (!plainText(state.content)) errors.content = "Article content is required.";
  else if (state.content.length > 200_000) errors.content = "Article content is too long.";
  const slug = state.slug.trim();
  if (slug && (slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    errors.slug = "Use a lowercase slug with hyphens, up to 80 characters.";
  }
  if (state.seoTitle.trim().length > 70) errors.seoTitle = "SEO title must be 70 characters or fewer.";
  if (state.seoDescription.trim().length > 180) errors.seoDescription = "Meta description must be 180 characters or fewer.";
  if (state.focusKeyword.trim().length > 80) errors.focusKeyword = "Focus keyword must be 80 characters or fewer.";
  const keywords = splitList(state.keywords);
  if (keywords.length > 12) errors.keywords = "Use up to 12 keywords.";
  else if (keywords.some((keyword) => keyword.length > 40)) errors.keywords = "Each keyword must be 40 characters or fewer.";
  if (state.ogTitle.trim().length > 90) errors.ogTitle = "Share title must be 90 characters or fewer.";
  if (state.ogDescription.trim().length > 200) errors.ogDescription = "Share description must be 200 characters or fewer.";
  if (state.faqs.length > 8) errors.faqs = "Use up to 8 questions.";
  else if (state.faqs.some((item) => item.question.trim().length > 180 || item.answer.trim().length > 800)) {
    errors.faqs = "Each question must be 180 characters or fewer, and each answer 800 characters or fewer.";
  }
  const related = splitList(state.relatedBlogIds);
  if (related.length > 6) errors.relatedBlogIds = "Use up to 6 related articles.";
  else if (related.some((item) => !/^[a-f\d]{24}$/i.test(item))) errors.relatedBlogIds = "Related articles must be article ids, separated by commas.";
  if (status === "scheduled") {
    if (!state.scheduledAt) errors.scheduledAt = "Choose a publish date and time before scheduling.";
    else if (new Date(state.scheduledAt).getTime() <= Date.now()) errors.scheduledAt = "Choose a future date and time. A past time publishes the article immediately.";
  }
  return errors;
}

const sectionClass = "grid gap-3.5 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm";
const fieldControl =
  "w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-muted hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20";
const inputClass = `${fieldControl} h-10`;
const textareaClass = `${fieldControl} min-h-[5.5rem] resize-y py-2.5 leading-relaxed`;
const invalidControl = "border-danger hover:border-danger focus:border-danger focus:ring-danger/20";
const primaryButtonClass =
  "inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex h-9 items-center rounded-md border border-border-subtle bg-white px-3 text-sm font-semibold text-foreground hover:border-primary/30 disabled:opacity-60";

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  className,
  stackHint = false,
  field,
  error,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  stackHint?: boolean;
  field?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div data-blog-field={field} className={cn("grid gap-1.5 text-[13px] font-semibold text-foreground", className)}>
      <label className="grid gap-1.5">
        <span className={cn(!stackHint && "flex items-baseline justify-between gap-3")}>
          <span className="block">{label}</span>
          {hint ? (
            <span className={cn("text-[11px] font-medium text-muted", stackHint && "mt-0.5 block font-normal leading-relaxed")}>{hint}</span>
          ) : null}
        </span>
        {children}
      </label>
      {error ? <p className="text-[11px] font-medium text-danger" role="alert">{error}</p> : null}
    </div>
  );
}

function ToggleRow({
  checked,
  title,
  hint,
  onChange,
}: {
  checked: boolean;
  title: string;
  hint: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border-subtle bg-hero-bg/60 px-3 py-2.5">
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs font-medium text-muted">{hint}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 size-4 accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function RemoveImageButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border-subtle bg-white px-2.5 text-[11px] font-semibold text-danger hover:border-danger/40"
      onClick={onRemove}
    >
      <X className="size-3.5" aria-hidden />
      Remove
    </button>
  );
}

function CoverField({
  label,
  required,
  image,
  onPick,
  onRemove,
}: {
  label: string;
  required?: boolean;
  image: BlogImage | null;
  onPick: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function choose(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    void onPick(file)
      .catch((err) => setUploadError(err instanceof Error ? err.message : "Upload failed"))
      .finally(() => setUploading(false));
  }

  return (
    <div className="grid w-full gap-1.5 text-xs font-semibold text-foreground">
      <span className="flex items-center justify-between gap-2">
        <span>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </span>
        <span className="font-medium text-muted">PNG, JPG, or WEBP · 5 MB</span>
      </span>
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-white">
        <button
          type="button"
          className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-hero-bg text-muted"
          onClick={() => inputRef.current?.click()}
        >
          {image?.url ? (
            <img src={croppedImageUrl(image.url, 1920, 1080)} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 px-2 text-[11px] font-medium">
              <ImageIcon className="size-4" aria-hidden="true" />
              Add cover
            </span>
          )}
          <span className="absolute bottom-2 right-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">1920×1080</span>
        </button>
        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-2.5 py-2">
          {image?.url ? <RemoveImageButton onRemove={onRemove} /> : null}
          <button
            type="button"
            className="inline-flex h-7 shrink-0 items-center rounded-md border border-border-subtle bg-white px-2.5 text-[11px] font-semibold text-foreground hover:border-primary/40 disabled:opacity-60"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : image?.url ? "Replace" : "Upload"}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          choose(file);
        }}
      />
      {uploadError ? <p className="text-[11px] font-medium text-danger">{uploadError}</p> : null}
    </div>
  );
}

function MediaSlot({
  label,
  image,
  required,
  square,
  cover,
  onPick,
  onRemove,
}: {
  label: string;
  image: BlogImage | null;
  required?: boolean;
  square?: boolean;
  cover?: boolean;
  onPick: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const fileInput = (
    <input
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="sr-only"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) void onPick(file).catch((err) => window.alert(err instanceof Error ? err.message : "Upload failed"));
      }}
    />
  );

  if (cover) {
    return <CoverField label={label} required={required} image={image} onPick={onPick} onRemove={onRemove} />;
  }

  return (
    <div className="grid w-full gap-1.5 text-xs font-semibold text-foreground">
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
        {square ? <span className="ml-1.5 font-medium text-muted">1:1</span> : null}
      </span>
      <div className="flex w-full items-center gap-3 self-start rounded-lg border border-border-subtle bg-hero-bg/40 p-2.5">
        <span
          className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-border-subtle bg-white text-muted ${square ? "aspect-square size-16 rounded-lg" : "size-14 rounded-md"}`}
        >
          {image?.url ? (
            <img src={image.url} alt="" className="aspect-square size-full object-cover object-center" />
          ) : (
            <ImageIcon className="size-4" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-medium text-muted">
            {image?.url ? "Image added" : "PNG, JPG, or WEBP · up to 5 MB"}
          </span>
          <span className="mt-1.5 inline-flex items-center gap-1.5">
            {image?.url ? <RemoveImageButton onRemove={onRemove} /> : null}
            <label className="inline-flex h-7 cursor-pointer items-center rounded-md border border-border-subtle bg-white px-2.5 text-[11px] font-semibold text-foreground shadow-sm hover:border-primary/40">
              {image?.url ? "Replace" : "Upload"}
              {fileInput}
            </label>
          </span>
        </span>
      </div>
    </div>
  );
}

function ImageField({
  label,
  image,
  required,
  onPick,
  onRemove,
}: {
  label: string;
  image: BlogImage | null;
  required?: boolean;
  onPick: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="grid gap-1.5 text-xs font-semibold text-foreground">
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      <div className="max-w-[220px] overflow-hidden rounded-lg border border-dashed border-border bg-hero-bg/50 text-center font-medium text-muted">
        {image?.url ? (
          <img src={displayImageUrl(image.url)} alt="" className="aspect-[1.91/1] w-full object-cover" />
        ) : (
          <span className="flex aspect-[1.91/1] w-full flex-col items-center justify-center gap-1 px-3 text-[11px]">
            <ImageIcon className="size-4" aria-hidden="true" />
            Share preview · 1.91:1
            <span>PNG, JPG, or WEBP · up to 5 MB</span>
          </span>
        )}
        <span className="mb-2 mt-2 inline-flex items-center justify-center gap-1.5">
          {image?.url ? <RemoveImageButton onRemove={onRemove} /> : null}
          <button
            type="button"
            className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm hover:border-primary/40 disabled:opacity-60"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : image?.url ? "Replace image" : "Choose image"}
          </button>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setUploadError(null);
            setUploading(true);
            void onPick(file)
              .catch((err) => setUploadError(err instanceof Error ? err.message : "Upload failed"))
              .finally(() => setUploading(false));
          }}
        />
      </div>
      {uploadError ? <p className="text-[11px] font-medium text-danger">{uploadError}</p> : null}
    </div>
  );
}
