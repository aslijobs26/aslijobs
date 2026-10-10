"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { useTranslate } from "@/i18n/translate";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import {
  computeAnchoredDropdownPosition,
  readSafeAreaInsets,
  readVisibleViewportSize,
  type AnchoredDropdownPosition,
} from "@/utils/anchored-dropdown-position";
import { cn } from "@/utils/cn";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useAuthMessageTranslator } from "./useAuthMessageTranslator";

type EmployerRegisterSearchableSelectProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: readonly EmployerRegisterSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  error?: string | null;
  errorId?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  hideLabel?: boolean;
  /** Hide the search input inside the dropdown panel. */
  hideSearch?: boolean;
  /** Placeholder for the in-panel search input. */
  searchPlaceholder?: string;
  /** Optional classes merged onto the trigger button (e.g. match toolbar inputs). */
  triggerClassName?: string;
  /** Optional classes merged onto each option button (e.g. compact period filters). */
  optionClassName?: string;
  /** Optional classes merged onto the dropdown panel. */
  panelClassName?: string;
  /** Accessible noun used for option counts, for example "applications". */
  countLabel?: string;
  /** Allow typing a value that is not in the preset options. */
  allowCustom?: boolean;
  /**
   * When set, only this many options show until the user searches.
   * Search results reveal the remaining matches.
   */
  initialVisibleCount?: number;
};

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
  name,
  error = null,
  errorId,
  "aria-invalid": ariaInvalid = false,
  "aria-describedby": ariaDescribedBy,
  hideLabel = false,
  hideSearch = false,
  searchPlaceholder,
  allowCustom = false,
  initialVisibleCount,
  triggerClassName,
  optionClassName,
  panelClassName,
  countLabel,
}: EmployerRegisterSearchableSelectProps) {
  const t = useTranslate();
  const translateMessage = useAuthMessageTranslator();
  const resolvedCountLabel = countLabel ?? t("auth.select.items");
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<AnchoredDropdownPosition | null>(
    null,
  );
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
      : allOptions.filter((option) => {
          const haystack = `${option.label} ${option.description ?? ""} ${option.value}`
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        });

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

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) {
      return;
    }

    const list = panel.querySelector("ul");
    const appliedMaxHeight =
      list instanceof HTMLElement ? list.style.maxHeight : "";
    if (list instanceof HTMLElement) {
      list.style.maxHeight = "none";
    }
    const contentHeight = panel.scrollHeight;
    if (list instanceof HTMLElement) {
      list.style.maxHeight = appliedMaxHeight;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const viewport = readVisibleViewportSize();
    setPosition(
      computeAnchoredDropdownPosition({
        anchorRect: triggerRect,
        contentWidth: triggerRect.width,
        contentHeight,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        insets: readSafeAreaInsets(),
        gap: 6,
      }),
    );
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    updatePosition();
  }, [isOpen, filteredOptions.length, canAddCustom, hideSearch, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      setQuery("");
      triggerRef.current?.focus();
    };

    const handleViewportChange = () => updatePosition();
    const handleScroll = (event: Event) => {
      if (event.target !== panelRef.current && !panelRef.current?.contains(event.target as Node)) {
        updatePosition();
      }
    };
    const visualViewport = window.visualViewport;

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleScroll, true);
    visualViewport?.addEventListener("resize", handleViewportChange);
    visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleScroll, true);
      visualViewport?.removeEventListener("resize", handleViewportChange);
      visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [isOpen, updatePosition]);

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
  const resolvedErrorId = errorId ?? (error ? `${id}-error` : undefined);
  const describedBy =
    ariaDescribedBy ?? (error && resolvedErrorId ? resolvedErrorId : undefined);
  const isInvalid = ariaInvalid || Boolean(error);

  return (
    <div className="employer-register-form-stack" ref={rootRef}>
      <RequiredFieldLabel
        htmlFor={id}
        required={required}
        className={cn(
          "employer-register-form-label",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </RequiredFieldLabel>

      <div
        className={cn(
          "employer-register-searchable-select",
          isOpen && "employer-register-searchable-select--open",
        )}
      >
        <button
          ref={triggerRef}
          id={id}
          type="button"
          name={name}
          className={cn(
            "employer-register-searchable-select-trigger",
            triggerClassName,
            isPlaceholder &&
              "employer-register-searchable-select-trigger--placeholder",
            disabled && "employer-register-searchable-select-trigger--disabled",
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-required={required || undefined}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((current) => !current);
            }
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="employer-register-searchable-select-value">
              {displayValue}
            </span>
            {typeof selectedOption?.count === "number" ? (
              <span
                className="shrink-0 tabular-nums text-sm font-semibold text-muted"
                aria-hidden="true"
              >
                {selectedOption.count}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className="employer-register-searchable-select-chevron"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        {isOpen
          ? createPortal(
          <div
            ref={panelRef}
            className={cn(
              "employer-register-searchable-select-panel",
              "employer-register-searchable-select-panel--anchored",
              panelClassName,
            )}
            style={
              position
                ? {
                    top: position.top,
                    left: position.left,
                    width: triggerRef.current?.getBoundingClientRect().width,
                    maxHeight: position.maxHeight,
                  }
                : { top: 0, left: 0, visibility: "hidden" }
            }
          >
            {hideSearch ? null : (
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
                    searchPlaceholder ??
                    (allowCustom
                      ? t("auth.select.searchOrAdd")
                      : t("auth.select.search"))
                  }
                  className="employer-register-searchable-select-search-input"
                  autoFocus
                  aria-label={
                    allowCustom
                      ? t("auth.select.searchOrAddAria", { label })
                      : t("auth.select.searchAria", { label })
                  }
                />
              </div>
            )}

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
                    className={cn(
                      "employer-register-searchable-select-option employer-register-searchable-select-option--custom",
                      optionClassName,
                    )}
                    onClick={() => selectOption(trimmedQuery)}
                  >
                    <span className="employer-register-searchable-select-option-label">
                      {t("auth.select.addCustom", { value: trimmedQuery })}
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
                  {t("auth.select.noResults")}
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
                          optionClassName,
                        )}
                        onClick={() => selectOption(option.value, option.label)}
                      >
                        <span className="employer-register-searchable-select-option-label">
                          <span className="block font-medium">{option.label}</span>
                          {option.description ? (
                            <span className="mt-0.5 block text-[11px] font-normal text-muted">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {typeof option.count === "number" ? (
                            <span
                              className="tabular-nums text-sm font-semibold text-muted"
                              aria-label={`${option.count} ${resolvedCountLabel}`}
                            >
                              {option.count}
                            </span>
                          ) : null}
                          {isSelected ? (
                            <Check
                              className="size-4 shrink-0"
                              strokeWidth={2.25}
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )
          : null}
      </div>
      <FieldError id={resolvedErrorId} message={translateMessage(error)} />
    </div>
  );
}
