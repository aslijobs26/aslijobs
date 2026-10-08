"use client";

import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  EMPLOYER_REGISTER_BUSINESS_DOCUMENT_OPTIONS,
  EMPLOYER_REGISTER_DOCUMENT_ACCEPT,
  EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_REGISTER_DOCUMENT_TYPE_OPTIONS,
  EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT,
  isBusinessEmployerAccountType,
} from "@/constants/employer-register";
import { employerProfileQueryKey } from "@/services/employer-login.service";
import {
  downloadEmployerDocument,
  employerDocumentsQueryKey,
  fetchEmployerDocuments,
  reuploadEmployerDocument,
  uploadEmployerDocument,
  type EmployerVerificationDocument,
} from "@/services/employer-profile.service";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Eye,
  FileText,
  Pencil,
  Upload,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";

type EmployerProfileDocumentsSectionProps = {
  accountType: "company" | "consultancy" | "individual";
  canUpdate: boolean;
};

type DocumentEditorMode = "upload" | "reupload";

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${parseFloat((bytes / 1024 ** index).toFixed(1))} ${units[index]}`;
}

function formatUploadedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function documentStatusClass(status: string): string {
  if (status === "approved" || status === "verified") {
    return "bg-primary-light text-primary";
  }
  if (status === "rejected") {
    return "bg-red-50 text-red-700";
  }
  return "bg-amber-50 text-amber-800";
}

function documentStatusLabel(status: string): string {
  if (status === "approved" || status === "verified") {
    return "Approved";
  }
  if (status === "rejected") {
    return "Rejected";
  }
  return "Pending review";
}

function documentTypeDisplayLabel(
  doc: EmployerVerificationDocument,
  options: readonly { value: string; label: string }[],
): string {
  return (
    options.find((option) => option.value === doc.documentType)?.label ??
    doc.documentTypeLabel
  );
}

function previewKind(doc: EmployerVerificationDocument): "pdf" | "image" | "other" {
  const mime = doc.mimeType.toLowerCase();
  const name = doc.originalName.toLowerCase();
  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(name)) {
    return "image";
  }
  return "other";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

export function EmployerProfileDocumentsSection({
  accountType,
  canUpdate,
}: EmployerProfileDocumentsSectionProps) {
  const queryClient = useQueryClient();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusiness = isBusinessEmployerAccountType(accountType);
  const documentOptions = isBusiness
    ? EMPLOYER_REGISTER_BUSINESS_DOCUMENT_OPTIONS
    : EMPLOYER_REGISTER_DOCUMENT_TYPE_OPTIONS;

  const [editor, setEditor] = useState<{
    mode: DocumentEditorMode;
    document?: EmployerVerificationDocument;
  } | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    doc: EmployerVerificationDocument;
    url: string;
  } | null>(null);

  const documentsQuery = useQuery({
    queryKey: employerDocumentsQueryKey,
    queryFn: fetchEmployerDocuments,
    staleTime: 30_000,
  });

  const refreshRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: employerDocumentsQueryKey }),
      queryClient.invalidateQueries({ queryKey: employerProfileQueryKey }),
    ]);
  };

  const uploadMutation = useMutation({
    mutationFn: uploadEmployerDocument,
    onSuccess: async () => {
      await refreshRelatedQueries();
      closeEditor();
      showAppToast("Verification document uploaded for review.", "success");
    },
    onError: (error: unknown) => {
      setFormError(
        getErrorMessage(error, "Could not upload the document. Please try again."),
      );
    },
  });

  const reuploadMutation = useMutation({
    mutationFn: reuploadEmployerDocument,
    onSuccess: async () => {
      await refreshRelatedQueries();
      closeEditor();
      showAppToast("Verification document replaced and sent for review.", "success");
    },
    onError: (error: unknown) => {
      setFormError(
        getErrorMessage(error, "Could not replace the document. Please try again."),
      );
    },
  });

  const documents = documentsQuery.data ?? [];
  const isSaving = uploadMutation.isPending || reuploadMutation.isPending;

  function closeEditor() {
    setEditor(null);
    setDocumentType("");
    setSelectedFile(null);
    setFormError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openUpload() {
    setEditor({ mode: "upload" });
    setDocumentType("");
    setSelectedFile(null);
    setFormError(null);
  }

  function openReupload(doc: EmployerVerificationDocument) {
    setEditor({ mode: "reupload", document: doc });
    setDocumentType(doc.documentType);
    setSelectedFile(null);
    setFormError(null);
  }

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (file.size > EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES) {
      setFormError("Document must be 5 MB or smaller.");
      return;
    }
    setSelectedFile(file);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!documentType.trim()) {
      setFormError("Select a document type.");
      return;
    }
    if (!selectedFile) {
      setFormError("Choose a PDF, PNG, JPG, or WEBP file.");
      return;
    }
    if (editor?.mode === "reupload" && editor.document) {
      await reuploadMutation.mutateAsync({
        documentId: editor.document.id,
        documentType,
        file: selectedFile,
      });
      return;
    }
    await uploadMutation.mutateAsync({
      documentType,
      file: selectedFile,
    });
  }

  async function handleDownload(doc: EmployerVerificationDocument) {
    try {
      const result = await downloadEmployerDocument(doc.id);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName || doc.originalName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showAppToast(
        getErrorMessage(error, "Unable to download this document."),
        "error",
      );
    }
  }

  async function handlePreview(doc: EmployerVerificationDocument) {
    try {
      const result = await downloadEmployerDocument(doc.id);
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
      setPreview({
        doc,
        url: URL.createObjectURL(result.blob),
      });
    } catch (error) {
      showAppToast(
        getErrorMessage(error, "Unable to preview this document."),
        "error",
      );
    }
  }

  function closePreview() {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  }

  const title = isBusiness
    ? "Verification Documents"
    : "Identity Documents";

  return (
    <section
      id="profile-section-documents"
      data-profile-section="documents"
      className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm"
    >
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {canUpdate ? (
          <button
            type="button"
            onClick={openUpload}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-9"
          >
            <Upload className="size-3.5" aria-hidden="true" />
            Upload
          </button>
        ) : null}
      </header>

      <div className="p-4">
        <p className="text-xs leading-5 text-muted">
          {isBusiness
            ? "Documents uploaded during company registration are stored here. Reupload if Operations asked for a clearer copy."
            : "Identity documents uploaded during registration are stored here. Reupload if Operations asked for a clearer copy."}
        </p>

        {documentsQuery.isError ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            Could not load verification documents. Please refresh and try again.
          </p>
        ) : null}

        {documentsQuery.isLoading ? (
          <p className="mt-4 text-sm text-muted">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border-subtle bg-hero-bg/60 px-4 py-5 text-sm text-muted">
            No verification document is on file yet.
            {canUpdate
              ? " Upload the same document type used at registration."
              : ""}
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex min-w-0 flex-col justify-between rounded-xl border border-border-subtle bg-hero-bg/40 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <FileText className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {documentTypeDisplayLabel(doc, documentOptions)}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                          documentStatusClass(doc.verificationStatus),
                        )}
                      >
                        {documentStatusLabel(doc.verificationStatus)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      {doc.originalName}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-muted">
                      {formatBytes(doc.fileSize)} • Uploaded{" "}
                      {formatUploadedAt(doc.uploadedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border-subtle pt-3">
                  <button
                    type="button"
                    onClick={() => void handlePreview(doc)}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-border-subtle bg-surface px-2 text-xs font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownload(doc)}
                    className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label={`Download ${doc.originalName}`}
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                  </button>
                  {canUpdate ? (
                    <button
                      type="button"
                      onClick={() => openReupload(doc)}
                      className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Reupload
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editor ? (
        <EmployerProfileDialog
          title={
            editor.mode === "reupload"
              ? "Reupload verification document"
              : "Upload verification document"
          }
          description={
            editor.mode === "reupload"
              ? "Replace the current file. Operations will review the new document."
              : "Upload a government document so Operations can verify this account."
          }
          onClose={isSaving ? () => undefined : closeEditor}
          footer={
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={closeEditor}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-hero-bg disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSubmit()}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
              >
                {isSaving
                  ? "Saving…"
                  : editor.mode === "reupload"
                    ? "Replace document"
                    : "Upload document"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <EmployerRegisterSearchableSelect
              id="profile-document-type"
              name="documentType"
              label="Document type"
              required
              value={documentType}
              placeholder="Select document type"
              options={documentOptions}
              onChange={setDocumentType}
              error={null}
            />

            <div>
              <label
                htmlFor={fileInputId}
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Document file
              </label>
              {selectedFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-hero-bg/60 px-3 py-2.5">
                  <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted">
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground"
                    aria-label="Remove selected file"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-hero-bg/60 px-4 py-6 text-center hover:border-primary/30 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Upload className="size-5 text-primary" aria-hidden="true" />
                  <span className="mt-2 text-sm font-semibold text-foreground">
                    Choose file
                  </span>
                  <span className="mt-1 text-xs text-muted">
                    {EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT}
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept={EMPLOYER_REGISTER_DOCUMENT_ACCEPT}
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </div>

            {formError ? (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
        </EmployerProfileDialog>
      ) : null}

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${preview.doc.documentTypeLabel} preview`}
        >
          <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-2xl">
            <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {preview.doc.documentTypeLabel}
                </p>
                <p className="truncate text-xs text-muted">
                  {preview.doc.originalName}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Close preview"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>
            <div className="min-h-0 flex-1 bg-hero-bg/50">
              {previewKind(preview.doc) === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob preview
                <img
                  src={preview.url}
                  alt={preview.doc.originalName}
                  className="size-full object-contain p-4"
                />
              ) : previewKind(preview.doc) === "pdf" ? (
                <iframe
                  title={preview.doc.originalName}
                  src={preview.url}
                  className="size-full border-0"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-sm text-muted">
                    Preview is not available for this file type.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDownload(preview.doc)}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
