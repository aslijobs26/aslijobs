import { FileText, Upload, X } from "lucide-react";
import {
  useRef,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "../../../../utils/cn";
import {
  ADD_EMPLOYER_DOCUMENT_ACCEPT,
  ADD_EMPLOYER_DOCUMENT_HINT,
  validateAddEmployerDocumentFile,
  type AddEmployerDocumentPreview,
} from "./add-employer-form";

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AddEmployerDocumentFieldProps {
  preview: AddEmployerDocumentPreview | null;
  error?: string;
  onPreviewChange: (preview: AddEmployerDocumentPreview | null) => void;
  onInvalidFile: (message: string) => void;
}

export function AddEmployerDocumentField({
  preview,
  error,
  onPreviewChange,
  onInvalidFile,
}: AddEmployerDocumentFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorId = "documentFile-error";

  const applySelectedFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    const fileError = validateAddEmployerDocumentFile(file);
    if (fileError) {
      onInvalidFile(fileError);
      return;
    }
    onPreviewChange({
      name: file.name,
      sizeBytes: file.size,
      file,
    });
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    applySelectedFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    applySelectedFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const openFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleUploadKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFileBrowser();
    }
  };

  return (
    <div>
      {preview ? (
        <div
          id="documentFile"
          className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-hero-bg/40 px-2.5 py-2"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {preview.name}
            </p>
            <p className="text-[11px] text-muted">
              {formatFileSize(preview.sizeBytes)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onPreviewChange(null)}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Remove selected document"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          id="documentFile"
          role="button"
          tabIndex={0}
          aria-label={`Upload Selected Document. ${ADD_EMPLOYER_DOCUMENT_HINT}`}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          onClick={openFileBrowser}
          onKeyDown={handleUploadKeyDown}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-subtle bg-hero-bg/40 px-3 py-4 text-center outline-none hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
            error && "border-danger",
          )}
        >
          <Upload className="size-5 text-muted" aria-hidden="true" />
          <p className="text-[11px] font-semibold text-foreground">
            Upload Selected Document
          </p>
          <p className="text-[10px] text-muted">{ADD_EMPLOYER_DOCUMENT_HINT}</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        id="documentFile-upload"
        name="documentFile"
        type="file"
        accept={ADD_EMPLOYER_DOCUMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileInputChange}
      />
      <p className="mt-1 text-[10px] text-muted">
        We use this document only for identity verification and it will remain
        secure.
      </p>
      {error ? (
        <p id={errorId} className="mt-1 text-[11px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
