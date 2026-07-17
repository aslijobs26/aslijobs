"use client";

import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { Check, ChevronDown, Search } from "lucide-react";
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
};

type DropdownPlacement = "down" | "up";

const DROPDOWN_PANEL_ESTIMATED_HEIGHT_PX = 280;

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
}: EmployerRegisterSearchableSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState<DropdownPlacement>("down");

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

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
  }, [isOpen, filteredOptions.length]);

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

  const closeDropdown = () => {
    setIsOpen(false);
    setQuery("");
  };

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
            !selectedOption && "employer-register-searchable-select-trigger--placeholder",
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
            {selectedOption?.label ?? placeholder}
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
                placeholder="Search..."
                className="employer-register-searchable-select-search-input"
                autoFocus
                aria-label={`Search ${label}`}
              />
            </div>

            <ul
              id={listboxId}
              role="listbox"
              aria-label={label}
              className="employer-register-searchable-select-options"
            >
              {filteredOptions.length === 0 ? (
                <li className="employer-register-searchable-select-empty">
                  No results found
                </li>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <li key={option.value} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        className={cn(
                          "employer-register-searchable-select-option",
                          isSelected &&
                            "employer-register-searchable-select-option--selected",
                        )}
                        onClick={() => {
                          onChange(option.value);
                          closeDropdown();
                        }}
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
