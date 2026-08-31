import { Download, ExternalLink, Eye, FileText, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { OperationsEmployerDocumentItem } from "../../../../types/operations-employers";
import { resolveMediaUrl } from "../../../../utils/resolve-media-url";
import { OperationsBadge } from "../../../ui/OperationsBadge";

interface EmployerDocumentsPanelProps {
  documents: OperationsEmployerDocumentItem[];
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function EmployerDocumentsPanel({
  documents,
}: EmployerDocumentsPanelProps) {
  const [previewDoc, setPreviewDoc] =
    useState<OperationsEmployerDocumentItem | null>(null);

  const previewUrl = previewDoc ? resolveMediaUrl(previewDoc.url) : null;
  const isPdf =
    previewDoc?.mimeType?.includes("pdf") ||
    previewDoc?.originalName?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Verification Documents ({documents.length})
            </h3>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">
            No verification documents uploaded yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const url = resolveMediaUrl(doc.url);

              return (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between rounded-xl border border-border-subtle bg-hero-bg/30 p-3.5 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                        <FileText className="size-4" />
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
                    {url ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border-subtle bg-surface py-1 text-xs font-semibold text-foreground hover:bg-hero-bg/60"
                        >
                          <Eye className="size-3.5" />
                          Preview
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex size-7 items-center justify-center rounded-md border border-border-subtle bg-surface text-muted hover:bg-hero-bg/60 hover:text-foreground"
                          title="Open in new tab"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                        <a
                          href={url}
                          download={doc.originalName}
                          className="inline-flex size-7 items-center justify-center rounded-md border border-border-subtle bg-surface text-muted hover:bg-hero-bg/60 hover:text-foreground"
                          title="Download document"
                        >
                          <Download className="size-3.5" />
                        </a>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted">
                        No file available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && previewUrl ? (
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-[92vh] max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-border-subtle bg-surface shadow-2xl animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between gap-2 border-b border-border-subtle p-3 sm:px-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-bold text-foreground sm:text-sm">
                    {previewDoc.documentTypeLabel} — {previewDoc.originalName}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-light"
                  >
                    <ExternalLink className="size-3.5" />
                    <span className="hidden sm:inline">Open Original</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    aria-label="Close preview"
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-hero-bg/60 hover:text-foreground sm:size-8"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-hero-bg/40 p-2 sm:p-4">
                {isPdf ? (
                  <iframe
                    src={previewUrl}
                    title={previewDoc.originalName}
                    className="size-full rounded-lg border border-border-subtle bg-white"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <img
                      src={previewUrl}
                      alt={previewDoc.originalName}
                      className="max-h-full max-w-full rounded-lg object-contain shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      ) : null}
    </div>
  );
}
