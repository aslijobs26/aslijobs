import { Building2, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useOperationsEmployersSearch } from "../../../../hooks/use-operations-post-job";
import type { OperationsEmployerOption } from "../../../../types/operations-post-job";
import { cn } from "../../../../utils/cn";
import { EmployerLogo } from "../../../ui/EmployerLogo";
import {
  OperationsFormField,
  operationsFieldInputClassName,
} from "../../../ui/OperationsFormField";

interface OperationsPostJobEmployerSelectProps {
  selectedEmployer: OperationsEmployerOption | null;
  onSelect: (employer: OperationsEmployerOption | null) => void;
  disabled?: boolean;
}

export function OperationsPostJobEmployerSelect({
  selectedEmployer,
  onSelect,
  disabled = false,
}: OperationsPostJobEmployerSelectProps) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const employersQuery = useOperationsEmployersSearch(
    debouncedSearch,
    debouncedSearch.length >= 2,
  );

  return (
    <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-hero-bg/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:px-4 sm:py-3.5"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-hero-bg text-primary ring-1 ring-border-subtle">
          <Building2 className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Employer Assignment
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                selectedEmployer
                  ? "bg-primary-light text-primary"
                  : "bg-hero-bg text-muted ring-1 ring-border-subtle",
              )}
            >
              {selectedEmployer ? "Assigned" : "Not Assigned"}
            </span>
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            Assign to an employer later to make this job live. Until then, it
            will remain as Draft.
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div
          id={panelId}
          className="space-y-3 border-t border-border-subtle px-3 pb-3 pt-3 sm:px-4 sm:pb-4"
        >
          {selectedEmployer ? (
            <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-hero-bg/40 p-3">
              <EmployerLogo
                name={selectedEmployer.displayName}
                logoUrl={selectedEmployer.logoUrl}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selectedEmployer.displayName}
                </p>
                <p className="truncate text-xs text-muted">
                  {[selectedEmployer.city, selectedEmployer.state]
                    .filter(Boolean)
                    .join(", ") || selectedEmployer.whatsappNumber}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(null)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Remove assigned employer"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <OperationsFormField
                label="Search employers"
                hint="Type at least 2 characters to search registered employers."
              >
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    disabled={disabled}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by company, phone, email, city…"
                    className={cn(operationsFieldInputClassName, "pl-9")}
                  />
                </div>
              </OperationsFormField>

              {debouncedSearch.length >= 2 ? (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border-subtle bg-hero-bg/30">
                  {employersQuery.isLoading ? (
                    <p className="px-3 py-4 text-xs text-muted">
                      Searching employers…
                    </p>
                  ) : employersQuery.isError ? (
                    <p className="px-3 py-4 text-xs text-danger">
                      Unable to load employers. Try again.
                    </p>
                  ) : employersQuery.data?.employers.length ? (
                    <ul className="divide-y divide-border-subtle">
                      {employersQuery.data.employers.map((employer) => (
                        <li key={employer.id}>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              onSelect(employer);
                              setSearch("");
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <EmployerLogo
                              name={employer.displayName}
                              logoUrl={employer.logoUrl}
                              size="md"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-foreground">
                                {employer.displayName}
                              </span>
                              <span className="block truncate text-[11px] text-muted">
                                {employer.whatsappNumber || employer.emailAddress}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-4 text-xs text-muted">
                      No employers found for &quot;{debouncedSearch}&quot;.
                    </p>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
