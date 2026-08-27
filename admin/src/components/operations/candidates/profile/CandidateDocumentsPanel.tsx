import { Download, ExternalLink, Eye, FileText, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { OperationsCandidateDetail } from "../../../../types/operations-candidates";
import { resolveMediaUrl } from "../../../../utils/resolve-media-url";

interface CandidateDocumentsPanelProps {
  detail: OperationsCandidateDetail;
}

type PreviewKind = "pdf" | "image" | "unsupported";

function detectPreviewKind(fileName: string, mimeType?: string): PreviewKind {
  const lowerName = fileName.toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();

  if (mime.includes("pdf") || lowerName.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    mime.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif)$/i.test(lowerName)
  ) {
    return "image";
  }

  return "unsupported";
}

const actionButtonClassName =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function CandidateDocumentsPanel({
  detail,
}: CandidateDocumentsPanelProps) {
  const resumeUrl = resolveMediaUrl(detail.uploadedResumeUrl);
  const fileName = detail.uploadedResumeName || "Uploaded Resume";
  const previewKind = detectPreviewKind(fileName);
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPreviewOpen || !resumeUrl || previewKind === "unsupported") {
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setPreviewError(null);
      setPreviewUrl(null);

      try {
        const response = await fetch(resumeUrl);
        if (!response.ok) {
          throw new Error("Unable to load resume preview.");
        }
        const blob = await response.blob();
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setPreviewError(
            "Unable to load resume preview. You can still download the file.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isPreviewOpen, resumeUrl, previewKind]);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewOpen]);

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewError(null);
  };

  const openPreview = () => {
    if (previewKind === "unsupported") {
      window.open(resumeUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setIsPreviewOpen(true);
  };

  const previewDialog =
    isPreviewOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-2 sm:items-center sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closePreview();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="flex h-[min(92vh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-lg"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-3 py-2.5 sm:px-4">
                <div className="min-w-0">
                  <p
                    id={titleId}
                    className="truncate text-sm font-semibold text-foreground"
                  >
                    Resume preview
                  </p>
                  <p className="truncate text-[11px] text-muted">{fileName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={actionButtonClassName}
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    Open
                  </a>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={closePreview}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border-subtle bg-surface text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label="Close resume preview"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 bg-hero-bg/40">
                {isLoadingPreview ? (
                  <div className="flex h-full items-center justify-center px-4">
                    <p className="text-xs text-muted">Loading resume preview…</p>
                  </div>
                ) : null}

                {previewError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                    <p className="text-sm font-medium text-danger">
                      {previewError}
                    </p>
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={detail.uploadedResumeName || undefined}
                      className={actionButtonClassName}
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      Download
                    </a>
                  </div>
                ) : null}

                {previewUrl && previewKind === "pdf" ? (
                  <iframe
                    title={`Resume preview: ${fileName}`}
                    src={previewUrl}
                    className="h-full w-full border-0 bg-surface"
                  />
                ) : null}

                {previewUrl && previewKind === "image" ? (
                  <div className="flex h-full items-start justify-center overflow-auto p-3 sm:p-4">
                    <img
                      src={previewUrl}
                      alt={`Resume preview: ${fileName}`}
                      className="max-h-full max-w-full rounded-md object-contain"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Documents</h3>

      {!resumeUrl ? (
        <div className="mt-4 rounded-lg border border-dashed border-border-subtle px-4 py-10 text-center">
          <p className="text-sm font-medium text-foreground">No documents</p>
          <p className="mt-1 text-xs text-muted">
            This candidate has not uploaded a resume file.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border-subtle bg-hero-bg/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-light text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {fileName}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">Resume document</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openPreview}
              className={actionButtonClassName}
            >
              <Eye className="size-3.5" aria-hidden="true" />
              Preview
            </button>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className={actionButtonClassName}
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Open
            </a>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              download={detail.uploadedResumeName || undefined}
              className={actionButtonClassName}
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download
            </a>
          </div>
        </div>
      )}

      {previewDialog}
    </section>
  );
}
