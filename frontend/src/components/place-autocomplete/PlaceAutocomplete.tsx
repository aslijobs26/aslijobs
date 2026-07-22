"use client";

import {
  searchIndiaCities,
  searchIndiaStates,
} from "@/services/nominatim-location.service";
import type { PlaceSuggestion } from "@/types/nominatim-location";
import { cn } from "@/utils/cn";
import { MapPin } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

const DEFAULT_CONTROL_CLASS_NAME =
  "relative flex h-12 w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20";

const DEFAULT_INPUT_CLASS_NAME =
  "min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60";

export type PlaceAutocompleteMode = "state" | "city";

export type PlaceAutocompleteProps = {
  id: string;
  mode: PlaceAutocompleteMode;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: PlaceSuggestion) => void;
  selectedState?: string;
  disabled?: boolean;
  placeholder?: string;
  showIcon?: boolean;
  iconClassName?: string;
  controlClassName?: string;
  inputClassName?: string;
};

type DropdownStatus = "idle" | "loading" | "ready" | "empty" | "error";

const COPY: Record<
  PlaceAutocompleteMode,
  {
    loading: string;
    empty: string;
    error: string;
    listLabel: string;
  }
> = {
  state: {
    loading: "Loading states...",
    empty: "No states found",
    error: "Unable to fetch states",
    listLabel: "State suggestions",
  },
  city: {
    loading: "Loading cities...",
    empty: "No cities found",
    error: "Unable to fetch cities",
    listLabel: "City suggestions",
  },
};

/**
 * Shared Photon-backed place autocomplete (same behaviour as Landing Page search).
 */
export function PlaceAutocomplete({
  id,
  mode,
  value,
  onChange,
  onSelect,
  selectedState = "",
  disabled = false,
  placeholder,
  showIcon = true,
  iconClassName = "text-foreground",
  controlClassName = DEFAULT_CONTROL_CLASS_NAME,
  inputClassName = DEFAULT_INPUT_CLASS_NAME,
}: PlaceAutocompleteProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<DropdownStatus>("idle");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const copy = COPY[mode];

  useEffect(() => {
    if (disabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      setSuggestions([]);
      setStatus("idle");
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    const query = value.trim();

    if (query.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      abortRef.current = null;
      setSuggestions([]);
      setStatus("idle");
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (mode === "city" && !selectedState.trim()) {
      setSuggestions([]);
      setStatus("idle");
      setIsOpen(false);
      return;
    }

    setStatus("loading");
    setIsOpen(true);

    const timeoutId = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const request =
        mode === "state"
          ? searchIndiaStates(query, controller.signal)
          : searchIndiaCities(query, selectedState, controller.signal);

      void request
        .then((results) => {
          if (controller.signal.aborted) {
            return;
          }

          setSuggestions(results);
          setHighlightedIndex(results.length > 0 ? 0 : -1);
          setStatus(results.length > 0 ? "ready" : "empty");
          setIsOpen(true);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setSuggestions([]);
          setHighlightedIndex(-1);
          setStatus("error");
          setIsOpen(true);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [disabled, mode, selectedState, value]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectSuggestion = (suggestion: PlaceSuggestion) => {
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
    setStatus("idle");
    setHighlightedIndex(-1);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (!isOpen || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current > 0 ? current - 1 : suggestions.length - 1,
      );
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[highlightedIndex];
      if (suggestion) {
        selectSuggestion(suggestion);
      }
    }
  };

  const showDropdown =
    !disabled &&
    isOpen &&
    value.trim().length >= MIN_QUERY_LENGTH &&
    (status === "loading" ||
      status === "ready" ||
      status === "empty" ||
      status === "error");

  return (
    <div ref={rootRef} className="relative w-full">
      <div className={controlClassName}>
        {showIcon ? (
          <MapPin
            className={cn("size-[18px] shrink-0", iconClassName)}
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : null}
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${listboxId}-option-${highlightedIndex}`
              : undefined
          }
          value={value}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (!disabled && value.trim().length >= MIN_QUERY_LENGTH) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className={inputClassName}
          autoComplete="off"
        />
      </div>

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={copy.listLabel}
          className="absolute left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-1.5 shadow-lg"
        >
          {status === "loading" ? (
            <p className="px-3 py-2.5 text-sm text-muted">{copy.loading}</p>
          ) : null}

          {status === "empty" ? (
            <p className="px-3 py-2.5 text-sm text-muted">{copy.empty}</p>
          ) : null}

          {status === "error" ? (
            <p className="px-3 py-2.5 text-sm text-muted">{copy.error}</p>
          ) : null}

          {status === "ready"
            ? suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    highlightedIndex === index
                      ? "bg-primary-light text-foreground"
                      : "text-foreground hover:bg-primary-light",
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <MapPin
                    className="size-3.5 shrink-0 text-muted"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 truncate">{suggestion.label}</span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
