"use client";

import { createLocationSelection } from "@/components/employer-jobs/jobs-filters";
import { searchIndiaPreferredLocations } from "@/services/nominatim-location.service";
import type { PlaceSuggestion } from "@/types/nominatim-location";
import { cn } from "@/utils/cn";
import { useEffect, useId, useRef, useState } from "react";

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;

export type JobsLocationSelection = ReturnType<typeof createLocationSelection>;

type JobsLocationAutocompleteProps = {
  id: string;
  value: string;
  placeholder?: string;
  inputClassName?: string;
  onSelect: (selection: JobsLocationSelection) => void;
  onClear: () => void;
  onInputChange: (label: string) => void;
};

export function JobsLocationAutocomplete({
  id,
  value,
  placeholder = "City or state",
  inputClassName,
  onSelect,
  onClear,
  onInputChange,
}: JobsLocationAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const committedValueRef = useRef("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const trimmedQuery = value.trim();
  const canSearch =
    isOpen &&
    trimmedQuery.length >= MIN_QUERY &&
    trimmedQuery !== committedValueRef.current;

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    let cleanupAbort: (() => void) | undefined;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      const controller = new AbortController();
      cleanupAbort = () => controller.abort();
      setIsLoading(true);

      void searchIndiaPreferredLocations(trimmedQuery, controller.signal)
        .then((results) => {
          if (!cancelled && !controller.signal.aborted) {
            setSuggestions(results);
          }
        })
        .catch(() => {
          if (!cancelled && !controller.signal.aborted) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (!cancelled && !controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      cleanupAbort?.();
    };
  }, [canSearch, trimmedQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const visibleSuggestions = canSearch ? suggestions : [];
  const showDropdown = canSearch;

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        className={cn(inputClassName)}
        onFocus={() => {
          if (trimmedQuery !== committedValueRef.current) {
            setIsOpen(true);
          }
        }}
        onChange={(event) => {
          const next = event.target.value;
          if (next.trim() !== committedValueRef.current) {
            committedValueRef.current = "";
          }
          onInputChange(next);
          if (!next.trim()) {
            onClear();
          }
          setIsOpen(true);
        }}
      />
      {showDropdown ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
        >
          {isLoading ? (
            <li className="px-3 py-2 text-xs text-muted">Searching…</li>
          ) : null}
          {!isLoading && visibleSuggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted">No locations found</li>
          ) : null}
          {visibleSuggestions.map((suggestion) => {
            const selected = suggestion.label === value;
            return (
              <li
                key={suggestion.id}
                role="option"
                aria-selected={selected}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full px-3 py-2 text-left text-xs hover:bg-primary-light",
                    selected
                      ? "font-semibold text-primary"
                      : "text-foreground",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    committedValueRef.current = suggestion.label.trim();
                    onSelect(createLocationSelection(suggestion));
                    setIsOpen(false);
                  }}
                >
                  {suggestion.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
