"use client";

import { searchJobSeekerRoles } from "@/services/job-seeker-register.service";
import { cn } from "@/utils/cn";
import { useEffect, useId, useRef, useState } from "react";

const DEBOUNCE_MS = 250;

type JobSeekerJobRoleAutocompleteProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function JobSeekerJobRoleAutocomplete({
  id,
  label,
  value,
  placeholder,
  disabled = false,
  onChange,
}: JobSeekerJobRoleAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (!isOpen || disabled) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);

      void searchJobSeekerRoles(query, { signal: controller.signal })
        .then((results) => {
          if (!controller.signal.aborted) {
            setRoles(results);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setRoles([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
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

  const showCustomOption =
    value.trim().length > 0 &&
    !roles.some((role) => role.toLowerCase() === value.trim().toLowerCase());

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
        {isOpen ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
          >
            {isLoading ? (
              <li className="px-3 py-2 text-sm text-muted">Searching…</li>
            ) : null}
            {showCustomOption ? (
              <li role="option">
                <button
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary-light"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(value.trim());
                    setIsOpen(false);
                  }}
                >
                  Use “{value.trim()}”
                </button>
              </li>
            ) : null}
            {!isLoading && roles.length === 0 && !showCustomOption ? (
              <li className="px-3 py-2 text-sm text-muted">
                No matching roles. Keep typing to use a custom role.
              </li>
            ) : null}
            {roles.map((role) => (
              <li key={role} role="option">
                <button
                  type="button"
                  className={cn(
                    "flex w-full px-3 py-2 text-left text-sm hover:bg-primary-light",
                    role === value
                      ? "font-semibold text-primary"
                      : "text-foreground",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(role);
                    setIsOpen(false);
                  }}
                >
                  {role}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
