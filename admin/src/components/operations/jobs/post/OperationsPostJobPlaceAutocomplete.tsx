import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  searchIndiaCities,
  searchIndiaStates,
} from "../../../../services/india-location.service";
import type { PlaceSuggestion } from "../../../../types/place-suggestion";
import { cn } from "../../../../utils/cn";
import { operationsFieldInputClassName } from "../../../ui/OperationsFormField";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export type OperationsPostJobPlaceAutocompleteMode = "state" | "city";

export interface OperationsPostJobPlaceAutocompleteProps {
  id: string;
  mode: OperationsPostJobPlaceAutocompleteMode;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: PlaceSuggestion) => void;
  selectedState?: string;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
}

type DropdownStatus = "idle" | "loading" | "ready" | "empty" | "error";

const COPY: Record<
  OperationsPostJobPlaceAutocompleteMode,
  { loading: string; empty: string; error: string; listLabel: string }
> = {
  state: {
    loading: "Searching states…",
    empty: "No states found",
    error: "Unable to fetch states",
    listLabel: "State suggestions",
  },
  city: {
    loading: "Searching cities…",
    empty: "No cities found",
    error: "Unable to fetch cities",
    listLabel: "City suggestions",
  },
};

export function OperationsPostJobPlaceAutocomplete({
  id,
  mode,
  value,
  onChange,
  onSelect,
  selectedState = "",
  disabled = false,
  placeholder,
  hasError = false,
}: OperationsPostJobPlaceAutocompleteProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const committedValueRef = useRef(value.trim());
  const isTypingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<DropdownStatus>("idle");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const copy = COPY[mode];

  const closeSuggestions = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSuggestions([]);
    setStatus("idle");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    if (disabled) {
      isTypingRef.current = false;
      closeSuggestions();
      return;
    }

    const query = value.trim();

    if (!isTypingRef.current) {
      committedValueRef.current = query;
      closeSuggestions();
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      closeSuggestions();
      return;
    }

    if (mode === "city" && !selectedState.trim()) {
      closeSuggestions();
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
          if (controller.signal.aborted || !isTypingRef.current) {
            return;
          }

          setSuggestions(results);
          setHighlightedIndex(results.length > 0 ? 0 : -1);
          setStatus(results.length > 0 ? "ready" : "empty");
          setIsOpen(true);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || !isTypingRef.current) {
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
    isTypingRef.current = false;
    committedValueRef.current = suggestion.label.trim();
    onSelect(suggestion);
    closeSuggestions();
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
    <div ref={rootRef} className="relative w-full min-w-0">
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
          const nextValue = event.target.value;
          isTypingRef.current = true;
          if (nextValue.trim() !== committedValueRef.current) {
            committedValueRef.current = "";
          }
          onChange(nextValue);
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        onFocus={() => {
          if (disabled || !isTypingRef.current) {
            return;
          }
          if (value.trim().length >= MIN_QUERY_LENGTH) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          operationsFieldInputClassName,
          hasError &&
            "border-danger hover:border-danger focus-visible:border-danger focus-visible:ring-danger/30",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={copy.listLabel}
          className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
        >
          {status === "loading" ? (
            <p className="px-3 py-2 text-xs text-muted">{copy.loading}</p>
          ) : null}

          {status === "empty" ? (
            <p className="px-3 py-2 text-xs text-muted">{copy.empty}</p>
          ) : null}

          {status === "error" ? (
            <p className="px-3 py-2 text-xs text-muted">{copy.error}</p>
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
                    "flex w-full px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    highlightedIndex === index
                      ? "bg-primary-light font-semibold text-primary"
                      : "text-foreground hover:bg-primary-light",
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <span className="min-w-0 truncate">{suggestion.label}</span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
