"use client";

import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

type EmployerRegisterSearchableSelectProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: readonly EmployerRegisterSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  hideLabel?: boolean;
  /** Allow typing a value that is not in the preset options. */
  allowCustom?: boolean;
  /**
   * When set, only this many options show until the user searches.
   * Search results reveal the remaining matches.
   */
  initialVisibleCount?: number;
};

type DropdownPlacement = "down" | "up";

const DROPDOWN_PANEL_ESTIMATED_HEIGHT_PX = 280;

function normalizeOptionKey(value: string) {
  return value.trim().toLowerCase();
}

export function EmployerRegisterSearchableSelect({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
  required = false,
  hideLabel = false,
  allowCustom = false,
  initialVisibleCount,
}: EmployerRegisterSearchableSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState<DropdownPlacement>("down");
  const [customOptions, setCustomOptions] = useState<
    EmployerRegisterSelectOption[]
  >([]);

  const allOptions = useMemo(() => {
    const merged = [...options];

    for (const customOption of customOptions) {
      const alreadyExists = merged.some(
        (option) =>
          normalizeOptionKey(option.value) ===
          normalizeOptionKey(customOption.value),
      );

      if (!alreadyExists) {
        merged.push(customOption);
      }
    }

    if (
      value &&
      !merged.some(
        (option) => normalizeOptionKey(option.value) === normalizeOptionKey(value),
      )
    ) {
      merged.push({ value, label: value });
    }

    return merged;
  }, [options, customOptions, value]);

  const selectedOption = allOptions.find(
    (option) => normalizeOptionKey(option.value) === normalizeOptionKey(value),
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matchedOptions = !normalizedQuery
      ? allOptions
      : allOptions.filter((option) =>
          option.label.toLowerCase().includes(normalizedQuery),
        );

    if (normalizedQuery || initialVisibleCount == null) {
      return matchedOptions;
    }

    const limitedOptions = matchedOptions.slice(0, initialVisibleCount);
    const selectedInLimited = limitedOptions.some(
      (option) =>
        normalizeOptionKey(option.value) === normalizeOptionKey(value),
    );

    if (!value || selectedInLimited) {
      return limitedOptions;
    }

    const selectedOptionInList = matchedOptions.find(
      (option) =>
        normalizeOptionKey(option.value) === normalizeOptionKey(value),
    );

    if (!selectedOptionInList) {
      return limitedOptions;
    }

    return [
      selectedOptionInList,
      ...limitedOptions.filter(
        (option) =>
          normalizeOptionKey(option.value) !== normalizeOptionKey(value),
      ).slice(0, Math.max(initialVisibleCount - 1, 0)),
    ];
  }, [allOptions, query, initialVisibleCount, value]);

  const trimmedQuery = query.trim();
  const canAddCustom =
    allowCustom &&
    trimmedQuery.length > 0 &&
    !allOptions.some(
      (option) =>
        normalizeOptionKey(option.value) === normalizeOptionKey(trimmedQuery) ||
        normalizeOptionKey(option.label) === normalizeOptionKey(trimmedQuery),
    );

  const selectOption = (nextValue: string, nextLabel = nextValue) => {
    if (
      allowCustom &&
      !options.some(
        (option) =>
          normalizeOptionKey(option.value) === normalizeOptionKey(nextValue),
      )
    ) {
      setCustomOptions((current) => {
        if (
          current.some(
            (option) =>
              normalizeOptionKey(option.value) ===
              normalizeOptionKey(nextValue),
          )
        ) {
          return current;
        }

        return [...current, { value: nextValue, label: nextLabel }];
      });
    }

    onChange(nextValue);
    setIsOpen(false);
    setQuery("");
  };

  useLayoutEffect(() => {
    if (!isOpen || !rootRef.current) {
      return;
    }

    const updatePlacement = () => {
      if (!rootRef.current) {
        return;
      }

      const rect = rootRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUp =
        spaceBelow < DROPDOWN_PANEL_ESTIMATED_HEIGHT_PX &&
        spaceAbove > spaceBelow;

      setPlacement(shouldOpenUp ? "up" : "down");
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    return () => window.removeEventListener("resize", updatePlacement);
  }, [isOpen, filteredOptions.length, canAddCustom]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && canAddCustom) {
      event.preventDefault();
      selectOption(trimmedQuery);
    }
  };

  const displayValue = selectedOption?.label ?? (value || placeholder);
  const isPlaceholder = !selectedOption && !value;

  return (
    <div className="employer-register-form-stack" ref={rootRef}>
      <label
        htmlFor={id}
        className={cn(
          "employer-register-form-label",
          hideLabel && "sr-only",
        )}
      >
        {label}
        {required ? "*" : null}
      </label>

      <div
        className={cn(
          "employer-register-searchable-select",
          isOpen && "employer-register-searchable-select--open",
        )}
      >
        <button
          id={id}
          type="button"
          className={cn(
            "employer-register-searchable-select-trigger",
            isPlaceholder &&
              "employer-register-searchable-select-trigger--placeholder",
            disabled && "employer-register-searchable-select-trigger--disabled",
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((current) => !current);
            }
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="employer-register-searchable-select-value">
            {displayValue}
          </span>
          <ChevronDown
            className="employer-register-searchable-select-chevron"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <div
            className={cn(
              "employer-register-searchable-select-panel",
              placement === "up" &&
                "employer-register-searchable-select-panel--up",
            )}
          >
            <div className="employer-register-searchable-select-search">
              <Search
                className="employer-register-searchable-select-search-icon"
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={
                  allowCustom ? "Search or type to add..." : "Search..."
                }
                className="employer-register-searchable-select-search-input"
                autoFocus
                aria-label={
                  allowCustom ? `Search or add ${label}` : `Search ${label}`
                }
              />
            </div>

            <ul
              id={listboxId}
              role="listbox"
              aria-label={label}
              className="employer-register-searchable-select-options"
            >
              {canAddCustom ? (
                <li role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="employer-register-searchable-select-option employer-register-searchable-select-option--custom"
                    onClick={() => selectOption(trimmedQuery)}
                  >
                    <span className="employer-register-searchable-select-option-label">
                      Add &ldquo;{trimmedQuery}&rdquo;
                    </span>
                    <Plus
                      className="size-4 shrink-0"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ) : null}

              {filteredOptions.length === 0 && !canAddCustom ? (
                <li className="employer-register-searchable-select-empty">
                  No results found
                </li>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected =
                    normalizeOptionKey(option.value) ===
                    normalizeOptionKey(value);

                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        className={cn(
                          "employer-register-searchable-select-option",
                          isSelected &&
                            "employer-register-searchable-select-option--selected",
                        )}
                        onClick={() => selectOption(option.value, option.label)}
                      >
                        <span className="employer-register-searchable-select-option-label">
                          {option.label}
                        </span>
                        {isSelected ? (
                          <Check
                            className="size-4 shrink-0"
                            strokeWidth={2.25}
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
