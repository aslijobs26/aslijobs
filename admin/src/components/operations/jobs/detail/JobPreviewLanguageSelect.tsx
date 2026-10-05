import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  OPERATIONS_JOB_PREVIEW_LANGUAGES,
  type OperationsJobPreviewLanguageCode,
} from "../../../../constants/operations-job-preview-languages";
import { cn } from "../../../../utils/cn";

interface JobPreviewLanguageSelectProps {
  value: OperationsJobPreviewLanguageCode;
  onChange: (language: OperationsJobPreviewLanguageCode) => void;
  disabled?: boolean;
}

export function JobPreviewLanguageSelect({
  value,
  onChange,
  disabled = false,
}: JobPreviewLanguageSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected =
    OPERATIONS_JOB_PREVIEW_LANGUAGES.find((option) => option.code === value) ??
    OPERATIONS_JOB_PREVIEW_LANGUAGES[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={`Preview language: ${selected.englishLabel}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground shadow-sm transition-colors",
          "hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-primary/40 bg-hero-bg",
        )}
      >
        <Globe2 className="size-3.5 text-primary" aria-hidden="true" />
        <span>{selected.label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Job preview languages"
          className="absolute right-0 z-30 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
        >
          {OPERATIONS_JOB_PREVIEW_LANGUAGES.map((option) => {
            const isSelected = option.code === value;
            return (
              <li key={option.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-primary-light font-semibold text-primary"
                      : "text-foreground hover:bg-hero-bg",
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected ? (
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
