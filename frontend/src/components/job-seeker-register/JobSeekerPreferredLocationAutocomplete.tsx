"use client";

import { searchIndiaPreferredLocations } from "@/services/nominatim-location.service";
import type { PlaceSuggestion } from "@/types/nominatim-location";
import { cn } from "@/utils/cn";
import { useEffect, useId, useRef, useState } from "react";

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;

type JobSeekerPreferredLocationAutocompleteProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function JobSeekerPreferredLocationAutocomplete({
  id,
  label,
  value,
  placeholder,
  disabled = false,
  onChange,
}: JobSeekerPreferredLocationAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || disabled) {
      return;
    }

    const query = value.trim();
    if (query.length < MIN_QUERY) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const controller = new AbortController();
      setIsLoading(true);

      void searchIndiaPreferredLocations(query, controller.signal)
        .then((results) => {
          setSuggestions(results);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [disabled, isOpen, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="employer-register-form-stack" ref={rootRef}>
      <label htmlFor={id} className="employer-register-form-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-required="true"
          className="employer-register-form-input"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
        />
        {isOpen && value.trim().length >= MIN_QUERY ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
          >
            {isLoading ? (
              <li className="px-3 py-2 text-sm text-muted">Searching…</li>
            ) : null}
            {!isLoading && suggestions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No locations found</li>
            ) : null}
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} role="option">
                <button
                  type="button"
                  className={cn(
                    "flex w-full px-3 py-2 text-left text-sm hover:bg-primary-light",
                    suggestion.label === value
                      ? "font-semibold text-primary"
                      : "text-foreground",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(suggestion.label);
                    setIsOpen(false);
                  }}
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
