import { Images, X } from "lucide-react";
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "../../../../utils/cn";
import {
  ADD_EMPLOYER_IMAGE_ACCEPT,
  ADD_EMPLOYER_IMAGE_HINT,
  validateAddEmployerImageFile,
  type AddEmployerImagePreview,
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

interface AddEmployerImageFieldProps {
  id: string;
  label: string;
  preview: AddEmployerImagePreview | null;
  error?: string;
  onPreviewChange: (preview: AddEmployerImagePreview | null) => void;
  onInvalidFile: (message: string) => void;
}

export function AddEmployerImageField({
  id,
  label,
  preview,
  error,
  onPreviewChange,
  onInvalidFile,
}: AddEmployerImageFieldProps) {
  const inputId = `${id}-upload`;
  const errorId = `${id}-error`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrl = preview?.previewUrl ?? null;

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const applySelectedFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    const fileError = validateAddEmployerImageFile(file);
    if (fileError) {
      onInvalidFile(fileError);
      return;
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    onPreviewChange({
      name: file.name,
      sizeBytes: file.size,
      file,
      previewUrl: URL.createObjectURL(file),
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

  const handleRemove = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    onPreviewChange(null);
  };

  return (
    <div>
      <p className="mb-1 block text-[11px] font-semibold text-muted">{label}</p>
      {preview ? (
        <div
          id={id}
          className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-hero-bg/40 px-2.5 py-2"
        >
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface">
            <img
              src={preview.previewUrl}
              alt=""
              className="size-full object-contain object-center p-0.5"
            />
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
            onClick={handleRemove}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          id={id}
          role="button"
          tabIndex={0}
          aria-label={`${label}. ${ADD_EMPLOYER_IMAGE_HINT}`}
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
          <Images className="size-5 text-muted" aria-hidden="true" />
          <p className="text-[11px] font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted">{ADD_EMPLOYER_IMAGE_HINT}</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        id={inputId}
        name={`${id}File`}
        type="file"
        accept={ADD_EMPLOYER_IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileInputChange}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-[11px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
