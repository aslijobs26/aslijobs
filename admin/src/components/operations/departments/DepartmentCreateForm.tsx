import { Building2, RefreshCw } from "lucide-react";
import type { FormEvent } from "react";
import { cn } from "../../../utils/cn";
import {
  generateAsliDepartmentCode,
  slugifyDepartmentCodePreview,
} from "./department-code";

export { slugifyDepartmentCodePreview } from "./department-code";

interface DepartmentCreateFormProps {
  name: string;
  onNameChange: (value: string) => void;
  code: string;
  codeTouched: boolean;
  onCodeChange: (value: string) => void;
  /** Mark code as user-edited, or clear that flag when regenerating. */
  onCodeTouchedChange: (touched: boolean) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  /** Existing department slugs used to keep generated codes unique. */
  existingSlugs: readonly string[];
  error?: string;
  success?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function DepartmentCreateForm({
  name,
  onNameChange,
  code,
  codeTouched,
  onCodeChange,
  onCodeTouchedChange,
  description,
  onDescriptionChange,
  existingSlugs,
  error,
  success,
  isSubmitting,
  onCancel,
  onSubmit,
}: DepartmentCreateFormProps) {
  const generated = generateAsliDepartmentCode(name, existingSlugs);
  const derivedCode = codeTouched ? code : generated.code;
  const canSubmit =
    name.trim().length >= 2 && derivedCode.trim().length >= 2 && !isSubmitting;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  const handleGenerateCode = () => {
    const next = generateAsliDepartmentCode(name, existingSlugs);
    onCodeTouchedChange(false);
    onCodeChange(next.code);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="ops-brand-border-glow flex h-full min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm xl:min-h-0"
    >
      <header className="shrink-0 border-b border-border-subtle px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
              Create Department
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              Add a department for team assignment and role scoping.
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-4 scrollbar-hidden">
        <label className="grid gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">
            Name <span className="text-danger">*</span>
          </span>
          <input
            id="create-department-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            minLength={2}
            maxLength={80}
            placeholder="Enter department name"
            className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-[12px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="create-department-code"
              className="text-[11px] font-semibold text-foreground"
            >
              Code <span className="text-danger">*</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={name.trim().length < 2 || isSubmitting}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              Generate unique
            </button>
          </div>
          <input
            id="create-department-code"
            value={derivedCode}
            onChange={(event) => {
              onCodeTouchedChange(true);
              onCodeChange(slugifyDepartmentCodePreview(event.target.value));
            }}
            required
            minLength={2}
            maxLength={80}
            placeholder="Auto from AsliJobs meaning"
            spellCheck={false}
            className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 font-mono text-[12px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:font-sans placeholder:text-muted focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>

        <label className="grid min-h-0 flex-1 gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">
            Description
          </span>
          <span className="relative flex min-h-0 flex-1 flex-col">
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={4}
              maxLength={400}
              placeholder="Describe the department's responsibility…"
              className="min-h-[7rem] w-full flex-1 resize-none rounded-lg border border-border-subtle bg-hero-bg/50 px-3 pb-7 pt-2.5 text-[12px] leading-relaxed text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <span
              aria-live="polite"
              className="pointer-events-none absolute bottom-2 right-2.5 text-[10px] font-normal tabular-nums text-muted"
            >
              {description.length}/400
            </span>
          </span>
        </label>

        <aside className="rounded-lg border border-border-subtle bg-hero-bg/60 px-3 py-2.5">
          <p className="text-[10px] leading-relaxed text-muted">
            Status defaults to{" "}
            <span className="font-semibold text-success">Active</span>.
            Organization unit, location, and department head are managed via
            Team / Organization assignment — not on the department record.
          </p>
        </aside>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-[12px] text-danger"
          >
            {error}
          </p>
        ) : null}
        {success ? (
          <p
            role="status"
            className="rounded-lg border border-success/25 bg-success/5 px-3 py-2 text-[12px] text-success"
          >
            {success}
          </p>
        ) : null}
      </div>

      <footer className="mt-auto flex shrink-0 gap-2 border-t border-border-subtle bg-hero-bg/30 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={cn(
            "h-9 flex-1 rounded-lg border border-border-subtle bg-surface text-[12px] font-semibold text-foreground",
            "hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "h-9 flex-1 rounded-lg bg-primary text-[12px] font-semibold text-surface",
            "hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSubmitting ? "Creating…" : "Create Department"}
        </button>
      </footer>
    </form>
  );
}
