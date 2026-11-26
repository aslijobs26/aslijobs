import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Clapperboard,
  Film,
  ImageIcon,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { getOperationsApiErrorMessage } from "../utils/operations-api-errors";
import {
  deleteAdminVideo,
  fetchAdminVideos,
  saveAdminVideo,
  updateAdminVideoStatus,
  updateAdminVideoOrder,
  uploadAdminVideo,
  type AdminVideo,
} from "../services/videos.service";

const inputClass = "h-10 w-full rounded-xl border border-border-subtle bg-surface px-3 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-muted hover:border-primary/25 focus:border-primary focus:ring-2 focus:ring-primary/20";

function youtubePreviewId(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "").toLowerCase();
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0]?.slice(0, 11) || "";
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/") || url.pathname.startsWith("/live/")) {
        return url.pathname.split("/").filter(Boolean)[1]?.slice(0, 11) || "";
      }
      return url.searchParams.get("v")?.slice(0, 11) || "";
    }
  } catch {
    return "";
  }
  return "";
}

export function OperationsVideosPage() {
  const [items, setItems] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editor, setEditor] = useState<AdminVideo | "new" | null>(null);
  const [preview, setPreview] = useState<AdminVideo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminVideo | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminVideos({ page, limit: 12, q, status, source });
      setItems(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(getOperationsApiErrorMessage(err, "Could not load videos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [page, q, status, source]);

  async function remove() {
    if (!pendingDelete) return;
    try {
      await deleteAdminVideo(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(getOperationsApiErrorMessage(err, "Could not delete the video."));
    }
  }

  async function toggleStatus(video: AdminVideo) {
    try {
      await updateAdminVideoStatus(video.id, video.status === "published" ? "draft" : "published");
      await load();
    } catch (err) {
      setError(getOperationsApiErrorMessage(err, "Could not update the video status."));
    }
  }

  async function changeOrder(video: AdminVideo, displayOrder: number) {
    try {
      await updateAdminVideoOrder(video.id, displayOrder);
      await load();
    } catch (err) {
      setError(getOperationsApiErrorMessage(err, "Could not update the display order."));
    }
  }

  const tabs = [
    { value: "", label: "All videos" },
    { value: "published", label: "Published" },
    { value: "draft", label: "Drafts" },
  ];

  return (
    <OperationsLayout title="Videos" subtitle="Manage the video library shown across your public site.">
      <div className="flex flex-col gap-4 pb-5">
        <section className="relative isolate overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.10] via-surface to-surface p-4 shadow-sm sm:p-6">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 -z-10 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-surface/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary shadow-sm">
                <Clapperboard className="size-3.5" aria-hidden="true" /> Content studio
              </span>
              <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Your video library</h2>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted sm:text-sm">
                Publish YouTube links or uploaded videos, then control how they appear in Latest videos.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-muted">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-success" /> Publish when ready</span>
                <span className="inline-flex items-center gap-1.5"><Film className="size-3.5 text-primary" /> YouTube and MP4/WebM</span>
              </div>
            </div>
            <button type="button" onClick={() => setEditor("new")} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-white shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2">
              <Plus className="size-4" /> Add a video
            </button>
          </div>
        </section>

        <section aria-label="Video library summary" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <SummaryCard icon={Video} label="In your library" value={total} detail="Total videos" tone="primary" />
          <SummaryCard icon={CheckCircle2} label="On this page" value={items.length} detail="Matching current filters" tone="success" />
          <SummaryCard icon={Upload} label="Supported sources" value="02" detail="YouTube · MP4 / WebM" tone="violet" className="col-span-2 lg:col-span-1" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 border-b border-border-subtle px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-hero-bg/70 p-1" role="tablist" aria-label="Video status">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.value}
                  className={`h-9 shrink-0 rounded-lg px-3.5 text-xs font-semibold transition-colors ${status === tab.value ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-foreground"}`}
                  onClick={() => { setPage(1); setStatus(tab.value); }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px] lg:w-[430px]">
              <label className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input aria-label="Search videos" className={`${inputClass} pl-9`} value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="Search by video title" />
              </label>
              <select aria-label="Filter by video source" className={`${inputClass} cursor-pointer`} value={source} onChange={(event) => { setPage(1); setSource(event.target.value); }}>
                <option value="">Every source</option><option value="youtube">YouTube</option><option value="uploaded">Uploaded</option>
              </select>
            </div>
          </div>

          {error ? <p className="mx-3 mt-3 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2.5 text-sm text-danger sm:mx-4">{error}</p> : null}
          {loading ? (
            <div className="grid gap-4 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-border-subtle"><div className="aspect-video animate-pulse bg-hero-bg" /><div className="space-y-2 p-4"><div className="h-3 w-2/3 animate-pulse rounded bg-hero-bg" /><div className="h-3 w-1/3 animate-pulse rounded bg-hero-bg" /></div></div>)}
            </div>
          ) : items.length === 0 ? (
            <VideoEmptyState hasFilters={Boolean(q || status || source)} onAdd={() => setEditor("new")} onReset={() => { setQ(""); setStatus(""); setSource(""); setPage(1); }} />
          ) : (
            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 xl:grid-cols-3">
              {items.map((video) => (
                <article key={video.id} className="group min-w-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg">
                  <button type="button" onClick={() => setPreview(video)} aria-label={`Preview ${video.title}`} className="relative block aspect-video w-full overflow-hidden bg-hero-bg text-left">
                    {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" /> : <span className="flex size-full items-center justify-center text-muted"><ImageIcon className="size-8" /></span>}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                      {video.source === "youtube" ? <span className="font-black text-red-400">▶</span> : <Film className="size-3 text-white" />}
                      {video.source === "youtube" ? "YouTube" : "Uploaded"}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">Order {video.displayOrder}</span>
                    <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-primary shadow-lg transition-transform group-hover:scale-110"><Play className="ml-0.5 size-4 fill-current" /></span>
                    <span className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md ${video.status === "published" ? "bg-emerald-500/90 text-white" : "bg-white/90 text-slate-700"}`}>
                      <span className={`size-1.5 rounded-full ${video.status === "published" ? "bg-white" : "bg-slate-400"}`} />
                      {video.status === "published" ? "Published" : "Draft"}
                    </span>
                  </button>
                  <div className="p-3.5 sm:p-4">
                    <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-foreground">{video.title}</h3>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
                      <span className="inline-flex min-w-0 items-center gap-1.5 truncate"><Clock3 className="size-3.5 shrink-0" />{video.createdAt ? new Date(video.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable"}</span>
                      <span className="shrink-0">{video.isFeatured ? "Featured" : "Standard"}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
                      <label className="flex items-center gap-2 text-[10px] font-semibold text-muted">
                        Order
                        <select aria-label={`Display order for ${video.title}`} className="h-8 rounded-lg border border-border-subtle bg-hero-bg px-2 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={video.displayOrder} onChange={(event) => void changeOrder(video, Number(event.target.value))}>
                          {Array.from({ length: 11 }, (_, index) => <option key={index} value={index}>{index}</option>)}
                        </select>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => void toggleStatus(video)} className={`inline-flex h-8 items-center rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${video.status === "published" ? "border-primary/20 bg-primary/[0.06] text-primary hover:bg-primary/10" : "border-success/20 bg-success/[0.06] text-success hover:bg-success/10"}`}>
                          {video.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button type="button" aria-label={`Edit ${video.title}`} onClick={() => setEditor(video)} className="inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:border-primary/25 hover:bg-primary/[0.05] hover:text-primary"><Pencil className="size-3.5" /></button>
                        <button type="button" aria-label={`Delete ${video.title}`} onClick={() => setPendingDelete(video)} className="inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:border-danger/20 hover:bg-danger/5 hover:text-danger"><Trash2 className="size-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {totalPages > 1 ? (
            <div className="flex flex-col gap-2 border-t border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-muted">Page {page} of {totalPages} <span className="px-1 text-border">·</span> {total} videos</p>
              <div className="flex gap-2">
                <button type="button" className="h-9 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-muted transition-colors hover:bg-hero-bg disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <button type="button" className="h-9 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-muted transition-colors hover:bg-hero-bg disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {editor ? <VideoEditor initial={editor === "new" ? null : editor} onClose={() => setEditor(null)} onSaved={async () => { setEditor(null); await load(); }} /> : null}
      {preview ? <VideoPreview video={preview} onClose={() => setPreview(null)} /> : null}
      {pendingDelete ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setPendingDelete(null)}>
          <div className="w-full max-w-sm rounded-xl bg-surface p-4" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-base font-semibold">Delete video?</h2><p className="mt-2 text-sm text-muted">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2"><button className="h-9 rounded-lg border border-border-subtle px-3" onClick={() => setPendingDelete(null)}>Cancel</button><button className="h-9 rounded-lg bg-danger px-3 text-white" onClick={() => void remove()}>Delete</button></div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  detail: string;
  tone: "primary" | "success" | "violet";
  className?: string;
}) {
  const toneClasses = {
    primary: "border-primary/15 bg-gradient-to-br from-primary/[0.07] to-surface text-primary",
    success: "border-success/15 bg-gradient-to-br from-success/[0.07] to-surface text-success",
    violet: "border-violet-500/15 bg-gradient-to-br from-violet-500/[0.07] to-surface text-violet-600 dark:text-violet-300",
  }[tone];
  return (
    <article className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:gap-4 sm:p-4 ${toneClasses} ${className}`}>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface shadow-sm">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
        <p className="mt-0.5 truncate text-lg font-bold leading-tight text-foreground sm:text-xl">{value}</p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-muted">{detail}</p>
      </div>
    </article>
  );
}

function VideoEmptyState({
  hasFilters,
  onAdd,
  onReset,
}: {
  hasFilters: boolean;
  onAdd: () => void;
  onReset: () => void;
}) {
  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-lg text-center">
        <div className="relative mx-auto flex size-20 items-center justify-center rounded-[1.6rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/[0.04] to-surface text-primary shadow-sm">
          <Clapperboard className="size-8" strokeWidth={1.6} aria-hidden="true" />
          <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-xl border-2 border-surface bg-primary text-white shadow-md">
            {hasFilters ? <Search className="size-3.5" /> : <Play className="ml-0.5 size-3.5 fill-white" />}
          </span>
        </div>
        <p className="mt-5 text-lg font-bold tracking-tight text-foreground">
          {hasFilters ? "No videos match these filters" : "Your video library is ready"}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted sm:text-sm">
          {hasFilters
            ? "Try a different search or clear the filters to see the full library."
            : "Add a YouTube video or upload an MP4/WebM file. Published videos can appear on your public homepage."}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {hasFilters ? (
            <button type="button" onClick={onReset} className="h-10 rounded-xl border border-border-subtle bg-surface px-4 text-xs font-bold text-foreground transition-colors hover:bg-hero-bg">Clear filters</button>
          ) : null}
          <button type="button" onClick={onAdd} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-md shadow-primary/15 transition hover:-translate-y-0.5 hover:shadow-lg">
            {hasFilters ? "Add a video instead" : "Add your first video"} <ArrowUpRight className="size-3.5" />
          </button>
        </div>
        {!hasFilters ? (
          <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-2 text-left">
            <div className="rounded-xl border border-border-subtle bg-surface/80 p-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted"><span className="font-black text-red-500">▶</span> YouTube</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">Paste a video link to get started.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface/80 p-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted"><Upload className="size-3 text-primary" /> Upload</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">Use an MP4 or WebM video file.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VideoEditor({ initial, onClose, onSaved }: { initial: AdminVideo | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [source, setSource] = useState<"youtube" | "uploaded">(initial?.source || "youtube");
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl || "");
  const [uploadedVideo, setUploadedVideo] = useState(initial?.uploadedVideo || null);
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl || "");
  const [status, setStatus] = useState<"draft" | "published">(initial?.status || "draft");
  const [displayOrder, setDisplayOrder] = useState(String(initial?.displayOrder ?? 0));
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const previewId = youtubePreviewId(youtubeUrl);
  const parsedDisplayOrder = displayOrder.trim() === "" ? Number.NaN : Number(displayOrder);
  const hasValidDisplayOrder = Number.isInteger(parsedDisplayOrder) && parsedDisplayOrder >= 0 && parsedDisplayOrder <= 9999;
  const canSave = !uploading && Boolean(title.trim()) && (
    source === "uploaded" ? Boolean(uploadedVideo?.url) : Boolean(previewId)
  ) && hasValidDisplayOrder;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!hasValidDisplayOrder) {
      setError("Display order must be a whole number between 0 and 9999.");
      return;
    }
    try {
      await saveAdminVideo(initial?.id || null, { title, description, source, youtubeUrl, youtubeVideoId: initial?.youtubeVideoId || "", thumbnailUrl, uploadedVideo, status, displayOrder: parsedDisplayOrder, isFeatured: initial?.isFeatured || false });
      await onSaved();
    } catch (err) {
      setError(getOperationsApiErrorMessage(err, "Could not save the video."));
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5" onClick={onClose}>
      <form onSubmit={submit} className="scrollbar-hidden max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-subtle bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border-subtle bg-surface/95 px-4 py-3.5 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Clapperboard className="size-5" /></span>
            <div className="min-w-0"><h2 className="truncate text-sm font-bold text-foreground sm:text-base">{initial ? "Edit video" : "Add a video"}</h2><p className="mt-0.5 text-[11px] text-muted">Prepare a video for your public content library.</p></div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-hero-bg hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="grid gap-4 p-4 sm:gap-5 sm:p-5">
          {error ? <p role="alert" className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2.5 text-xs font-medium text-danger">{error}</p> : null}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Choose a source</p>
            <div className="grid grid-cols-2 gap-2">
              {(["youtube", "uploaded"] as const).map((value) => (
                <button key={value} type="button" onClick={() => setSource(value)} className={`flex min-w-0 items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${source === value ? "border-primary/35 bg-primary/[0.06] ring-2 ring-primary/10" : "border-border-subtle hover:border-primary/20 hover:bg-hero-bg/60"}`}>
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${source === value ? "bg-primary text-white" : "bg-hero-bg text-muted"}`}>{value === "youtube" ? <Play className="ml-0.5 size-4 fill-current" /> : <Upload className="size-4" />}</span>
                  <span className="min-w-0"><span className="block truncate text-xs font-bold text-foreground">{value === "youtube" ? "YouTube link" : "Upload a file"}</span><span className="mt-0.5 block truncate text-[10px] text-muted">{value === "youtube" ? "Paste a public video URL" : "MP4 or WebM, up to 100 MB"}</span></span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[11px] font-bold text-foreground sm:col-span-2">Video title<input required className={inputClass} maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this video a clear title" /></label>
            <label className="grid gap-1.5 text-[11px] font-bold text-foreground sm:col-span-2">Short description <span className="font-normal text-muted">(optional)</span><textarea className={`${inputClass} h-20 resize-y py-2`} maxLength={400} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short summary to help viewers understand the video" /></label>
          {source === "youtube" ? (
            <>
              <label className="grid gap-1.5 text-[11px] font-bold text-foreground sm:col-span-2">YouTube video URL<input required className={inputClass} value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://youtube.com/watch?v=..." /><span className="font-normal text-muted">Standard links, youtu.be links, and Shorts are supported.</span></label>
              {previewId ? <div className="overflow-hidden rounded-xl border border-border-subtle bg-hero-bg sm:col-span-2"><img src={thumbnailUrl || `https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`} alt="YouTube video thumbnail preview" className="aspect-video w-full object-cover" /><p className="px-3 py-2 text-[10px] font-medium text-muted">Thumbnail preview</p></div> : null}
            </>
          ) : (
            <label className="grid gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.025] p-3 text-[11px] font-bold text-foreground sm:col-span-2 sm:p-4"><span className="inline-flex items-center gap-2"><Upload className="size-4 text-primary" /> Select video file <span className="font-normal text-muted">MP4 or WebM · max 100 MB</span></span><input type="file" accept="video/mp4,video/webm" onChange={async (event) => {
              const input = event.currentTarget;
              const file = input.files?.[0]; if (!file) return;
              if (!["video/mp4", "video/webm"].includes(file.type)) {
                setUploadError("Choose an MP4 or WebM video file.");
                input.value = "";
                return;
              }
              if (file.size > 100 * 1024 * 1024) {
                setUploadError("Video must be 100 MB or smaller.");
                input.value = "";
                return;
              }
              setUploading(true); setUploadProgress(0); setUploadError(null); setError(null);
              try {
                setUploadedVideo(await uploadAdminVideo(file, setUploadProgress));
              } catch (err) {
                setUploadError(getOperationsApiErrorMessage(err, "Could not upload the video. Try again or check your connection."));
                input.value = "";
              } finally {
                setUploading(false);
              }
            }} />{uploading ? (
              <span className="grid gap-1.5">
                <span className="flex items-center justify-between gap-2 text-primary"><span>{uploadProgress >= 100 ? "Saving video to storage…" : "Uploading video…"}</span><span>{uploadProgress}%</span></span>
                <span className="h-1.5 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}><span className="block h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} /></span>
                <span className="font-normal text-muted">Large uploads may take a few minutes. Keep this window open.</span>
              </span>
            ) : uploadError ? <span role="alert" className="font-semibold text-danger">{uploadError} Select the file again to retry.</span> : uploadedVideo ? <span className="text-success">Video uploaded successfully</span> : <span className="font-normal text-muted">Choose a file from your device.</span>}</label>
          )}
            {source === "uploaded" && uploadedVideo?.url ? <video src={uploadedVideo.url} controls className="aspect-video w-full rounded-xl bg-black sm:col-span-2" /> : null}
            <label className="grid gap-1.5 text-[11px] font-bold text-foreground sm:col-span-2">Custom thumbnail URL <span className="font-normal text-muted">(optional)</span><input className={inputClass} value={thumbnailUrl} onChange={(event) => setThumbnailUrl(event.target.value)} placeholder="https://…" /></label>
            <label className="grid gap-1.5 text-[11px] font-bold text-foreground">Publication status<select className={`${inputClass} cursor-pointer`} value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")}><option value="draft">Draft</option><option value="published">Published</option></select></label>
            <label className="grid gap-1.5 text-[11px] font-bold text-foreground">Display order<input type="number" min={0} max={9999} step={1} required className={inputClass} value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} /><span className="font-normal text-muted">Enter a whole number from 0 to 9999. Lower numbers appear first.</span></label>
          </div>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border-subtle bg-surface/95 px-4 py-3 backdrop-blur sm:px-5">
          {!canSave ? <p className="mr-auto self-center text-[10px] font-medium text-muted">{uploading ? "Wait for the upload to finish." : source === "uploaded" && !uploadedVideo?.url ? "Upload the video successfully to enable saving." : !title.trim() ? "Add a title to continue." : source === "youtube" && !previewId ? "Add a valid video URL to continue." : "Enter a whole number from 0 to 9999 for display order."}</p> : null}
          <button type="button" className="h-10 rounded-xl border border-border-subtle px-4 text-xs font-bold text-muted transition-colors hover:bg-hero-bg hover:text-foreground" onClick={onClose}>Cancel</button>
          <button disabled={!canSave} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50" type="submit"><CheckCircle2 className="size-3.5" />{initial ? "Save changes" : "Save video"}</button>
        </div>
      </form>
    </div>
  );
}

function VideoPreview({ video, onClose }: { video: AdminVideo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-black" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-3 py-2 text-white"><p className="truncate text-sm font-semibold">{video.title}</p><button type="button" aria-label="Close" onClick={onClose}><X className="size-4" /></button></div>
        <div className="aspect-video">{video.source === "youtube" ? <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?autoplay=1&playsinline=1`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <video className="size-full" src={video.uploadedVideo?.url} controls autoPlay />}</div>
      </div>
    </div>
  );
}
