"use client";

import { fetchEmployerLocationSuggestions } from "@/services/employer-applications.service";
import { cn } from "@/utils/cn";
import { useEffect, useId, useRef, useState } from "react";

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;

type CandidatesLocationAutocompleteProps = {
  id?: string;
  value: string;
  publicJobId?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function CandidatesLocationAutocomplete({
  id = "candidates-location-filter",
  value,
  publicJobId,
  disabled = false,
  onChange,
}: CandidatesLocationAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(value.trim().replace(/\s+/g, " "));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    if (!isOpen || disabled) {
      return;
    }

    if (debouncedQuery.length < MIN_QUERY) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    void fetchEmployerLocationSuggestions(
      {
        q: debouncedQuery,
        publicJobId,
      },
      controller.signal,
    )
      .then((locations) => {
        setSuggestions(locations);
      })
      .catch((error: unknown) => {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code?: string }).code === "ERR_CANCELED"
        ) {
          return;
        }
        setSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, disabled, isOpen, publicJobId]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const showDropdown = isOpen && debouncedQuery.length >= MIN_QUERY;

  return (
    <div className="relative" ref={rootRef}>
      <input
        id={id}
        type="search"
        value={value}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Search city or state"
        className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {showDropdown ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
        >
          {isLoading ? (
            <li className="px-3 py-2 text-sm text-muted">Searching…</li>
          ) : null}
          {!isLoading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">
              No matching locations found.
            </li>
          ) : null}
          {!isLoading
            ? suggestions.map((suggestion) => (
                <li key={suggestion} role="option">
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-10 w-full px-3 py-2 text-left text-sm hover:bg-primary-light focus-visible:outline-none focus-visible:bg-primary-light",
                      suggestion === value.trim()
                        ? "font-semibold text-primary"
                        : "text-foreground",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(suggestion);
                      setIsOpen(false);
                    }}
                  >
                    {suggestion}
                  </button>
                </li>
              ))
            : null}
        </ul>
      ) : null}
    </div>
  );
}
