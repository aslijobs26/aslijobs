import { Building2, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  useOperationsEmployersList,
  useOperationsEmployersSearch,
} from "../../../../hooks/use-operations-post-job";
import type { OperationsEmployerOption } from "../../../../types/operations-post-job";
import { cn } from "../../../../utils/cn";
import { EmployerLogo } from "../../../ui/EmployerLogo";

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
  const dropdownId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Pre-load all employers when the dropdown opens
  const allEmployersQuery = useOperationsEmployersList(isOpen);

  // Filtered search when user has typed at least 2 chars
  const searchQuery = useOperationsEmployersSearch(
    debouncedSearch,
    isOpen && debouncedSearch.length >= 2,
  );

  const isSearching = debouncedSearch.length >= 2;
  const activeQuery = isSearching ? searchQuery : allEmployersQuery;
  const employers = activeQuery.data?.employers ?? [];

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  function handleOpen() {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (isOpen) setSearch("");
  }

  function handleSelect(employer: OperationsEmployerOption) {
    onSelect(employer);
    setIsOpen(false);
    setSearch("");
  }

  function handleClear() {
    onSelect(null);
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
      {/* Header trigger */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        disabled={disabled}
        onClick={handleOpen}
        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-hero-bg/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3.5"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-hero-bg text-primary ring-1 ring-border-subtle">
          <Building2 className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          {selectedEmployer ? (
            <>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Employer Assignment
                </span>
                <span className="inline-flex rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Assigned
                </span>
              </span>
              <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
                <span className="truncate text-xs font-medium text-foreground">
                  {selectedEmployer.displayName}
                </span>
                {(selectedEmployer.city || selectedEmployer.state) ? (
                  <span className="shrink-0 text-xs text-muted">
                    ·{" "}
                    {[selectedEmployer.city, selectedEmployer.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : null}
              </span>
            </>
          ) : (
            <>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Employer Assignment
                </span>
                <span className="inline-flex rounded-full bg-hero-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted ring-1 ring-border-subtle">
                  Not Assigned
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                Assign to an employer to make this job live. Until then, it will
                remain as Draft.
              </span>
            </>
          )}
        </span>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel */}
      {isOpen ? (
        <div
          id={dropdownId}
          ref={containerRef}
          className="border-t border-border-subtle px-3 pb-3 pt-3 sm:px-4 sm:pb-4"
        >
          {/* Selected employer chip */}
          {selectedEmployer ? (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary-light/30 p-3">
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
                onClick={handleClear}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Remove assigned employer"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {/* Search input */}
          <div className="relative mb-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, phone, email, city…"
              className="h-9 w-full min-w-0 rounded-lg border border-border-subtle bg-hero-bg/60 pl-9 pr-3 text-xs font-medium text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted hover:border-primary/25 hover:bg-surface focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          {/* Employer list */}
          <div className="max-h-52 overflow-y-auto rounded-lg border border-border-subtle bg-hero-bg/30">
            {activeQuery.isLoading ? (
              <div className="flex items-center gap-2 px-3 py-4">
                <Loader2
                  className="size-3.5 animate-spin text-muted"
                  aria-hidden="true"
                />
                <p className="text-xs text-muted">Loading employers…</p>
              </div>
            ) : activeQuery.isError ? (
              <p className="px-3 py-4 text-xs text-danger">
                Unable to load employers. Try again.
              </p>
            ) : employers.length > 0 ? (
              <ul role="listbox" aria-label="Registered employers">
                {employers.map((employer) => {
                  const isSelected = selectedEmployer?.id === employer.id;
                  return (
                    <li key={employer.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => handleSelect(employer)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                          isSelected
                            ? "bg-primary-light/40 text-primary"
                            : "hover:bg-surface",
                        )}
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
                            {[employer.city, employer.state]
                              .filter(Boolean)
                              .join(", ") ||
                              employer.whatsappNumber ||
                              employer.emailAddress}
                          </span>
                        </span>
                        {isSelected ? (
                          <span className="shrink-0 text-[10px] font-semibold text-primary">
                            Selected
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : isSearching ? (
              <p className="px-3 py-4 text-xs text-muted">
                No employers found for &ldquo;{debouncedSearch}&rdquo;.
              </p>
            ) : (
              <p className="px-3 py-4 text-xs text-muted">
                No registered employers found.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
