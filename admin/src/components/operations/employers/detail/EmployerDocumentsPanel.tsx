import { Download, ExternalLink, Eye, FileText, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchOperationsEmployerDocumentBlob } from "../../../../services/operations-employers.service";
import type { OperationsEmployerDocumentItem } from "../../../../types/operations-employers";
import { resolveMediaUrl } from "../../../../utils/resolve-media-url";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { OperationsCanKey } from "../../auth/OperationsCanKey";

interface EmployerDocumentsPanelProps {
  documents: OperationsEmployerDocumentItem[];
  /** When set, preview/download use the authenticated document blob API. */
  employerId?: string;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isPdfDocument(doc: OperationsEmployerDocumentItem): boolean {
  return (
    Boolean(doc.mimeType?.includes("pdf")) ||
    doc.originalName.toLowerCase().endsWith(".pdf")
  );
}

function hasDirectUrl(doc: OperationsEmployerDocumentItem): boolean {
  return Boolean(resolveMediaUrl(doc.url));
}

function canAccessDocument(
  doc: OperationsEmployerDocumentItem,
  employerId: string | undefined,
): boolean {
  return Boolean(employerId) || hasDirectUrl(doc);
}

export function EmployerDocumentsPanel({
  documents,
  employerId,
}: EmployerDocumentsPanelProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [previewDoc, setPreviewDoc] =
    useState<OperationsEmployerDocumentItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewDoc) {
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setPreviewError(null);
      setPreviewUrl(null);

      try {
        if (employerId) {
          const { blob } = await fetchOperationsEmployerDocumentBlob(
            employerId,
            previewDoc.id,
          );
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
          return;
        }

        const directUrl = resolveMediaUrl(previewDoc.url);
        if (!directUrl) {
          throw new Error("Document unavailable");
        }
        if (!cancelled) {
          setPreviewUrl(directUrl);
        }
      } catch {
        if (!cancelled) {
          setPreviewError(
            "Unable to load document preview. You can still try downloading the file.",
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
  }, [previewDoc, employerId]);

  useEffect(() => {
    if (!previewDoc) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewDoc(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewDoc]);

  const closePreview = () => {
    setPreviewDoc(null);
    setPreviewError(null);
  };

  const handleDownload = async (doc: OperationsEmployerDocumentItem) => {
    setActionError(null);

    if (employerId) {
      setDownloadingId(doc.id);
      try {
        const { blob, fileName } = await fetchOperationsEmployerDocumentBlob(
          employerId,
          doc.id,
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || doc.originalName || "document";
        link.click();
        URL.revokeObjectURL(url);
      } catch {
        setActionError("Unable to download document. Please try again.");
      } finally {
        setDownloadingId(null);
      }
      return;
    }

    const url = resolveMediaUrl(doc.url);
    if (!url) {
      setActionError("Document unavailable");
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = doc.originalName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const handleOpenExternal = async (doc: OperationsEmployerDocumentItem) => {
    setActionError(null);

    if (employerId) {
      setDownloadingId(doc.id);
      try {
        const { blob } = await fetchOperationsEmployerDocumentBlob(
          employerId,
          doc.id,
        );
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch {
        setActionError("Unable to open document. Please try again.");
      } finally {
        setDownloadingId(null);
      }
      return;
    }

    const url = resolveMediaUrl(doc.url);
    if (!url) {
      setActionError("Document unavailable");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold text-foreground">
              Verification Documents ({documents.length})
            </h3>
          </div>
        </div>

        {actionError ? (
          <p className="mt-3 text-xs text-danger" role="alert">
            {actionError}
          </p>
        ) : null}

        {documents.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">
            No verification documents uploaded yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const accessible = canAccessDocument(doc, employerId);

              return (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between rounded-xl border border-border-subtle bg-hero-bg/30 p-3.5 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <OperationsBadge
                        variant={
                          doc.verificationStatus === "approved" ||
                          doc.verificationStatus === "verified"
                            ? "default"
                            : doc.verificationStatus === "rejected"
                              ? "high"
                              : "medium"
                        }
                      >
                        {doc.verificationStatus.charAt(0).toUpperCase() +
                          doc.verificationStatus.slice(1)}
                      </OperationsBadge>
                    </div>

                    <h4 className="mt-2.5 truncate text-xs font-bold text-foreground">
                      {doc.documentTypeLabel}
                    </h4>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {doc.originalName}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {formatBytes(doc.fileSize)} • Uploaded{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-border-subtle pt-2.5">
                    {accessible ? (
                      <>
                        <OperationsCanKey permissionKey="employers.profile.documents.view">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border-subtle bg-surface py-1 text-xs font-semibold text-foreground hover:bg-hero-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                            Preview
                          </button>
                        </OperationsCanKey>
                        <OperationsCanKey permissionKey="employers.profile.documents.view">
                          <button
                            type="button"
                            onClick={() => void handleOpenExternal(doc)}
                            disabled={downloadingId === doc.id}
                            className="inline-flex size-7 items-center justify-center rounded-md border border-border-subtle bg-surface text-muted hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                            title="Open in new tab"
                            aria-label={`Open ${doc.originalName} in new tab`}
                          >
                            <ExternalLink
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        </OperationsCanKey>
                        <OperationsCanKey permissionKey="employers.profile.documents.download">
                          <button
                            type="button"
                            onClick={() => void handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="inline-flex size-7 items-center justify-center rounded-md border border-border-subtle bg-surface text-muted hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                            title="Download document"
                            aria-label={`Download ${doc.originalName}`}
                          >
                            <Download className="size-3.5" aria-hidden="true" />
                          </button>
                        </OperationsCanKey>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted">
                        Document unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewDoc
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <div className="flex h-[92vh] max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-border-subtle bg-surface shadow-2xl animate-in fade-in-0 zoom-in-95">
                <div className="flex items-center justify-between gap-2 border-b border-border-subtle p-3 sm:px-4">
                  <div className="min-w-0 flex-1">
                    <h3
                      id={titleId}
                      className="truncate text-xs font-bold text-foreground sm:text-sm"
                    >
                      {previewDoc.documentTypeLabel} — {previewDoc.originalName}
                    </h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => void handleOpenExternal(previewDoc)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Open Original</span>
                    </button>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={closePreview}
                      aria-label="Close preview"
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:size-8"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto bg-hero-bg/40 p-2 sm:p-4">
                  {isLoadingPreview ? (
                    <div className="flex size-full items-center justify-center text-xs text-muted">
                      Loading preview…
                    </div>
                  ) : null}
                  {!isLoadingPreview && previewError ? (
                    <div className="flex size-full items-center justify-center text-xs text-danger">
                      {previewError}
                    </div>
                  ) : null}
                  {!isLoadingPreview && previewUrl && isPdfDocument(previewDoc) ? (
                    <iframe
                      src={previewUrl}
                      title={previewDoc.originalName}
                      className="size-full rounded-lg border border-border-subtle bg-white"
                    />
                  ) : null}
                  {!isLoadingPreview &&
                  previewUrl &&
                  !isPdfDocument(previewDoc) ? (
                    <div className="flex size-full items-center justify-center">
                      <img
                        src={previewUrl}
                        alt={previewDoc.originalName}
                        className="max-h-full max-w-full rounded-lg object-contain shadow-md"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
