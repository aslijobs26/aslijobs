"use client";

import {
  SITE_DEFAULT_LANGUAGE,
  SITE_LANGUAGE_OPTIONS,
  type SiteLanguageOption,
} from "@/constants/site-language";
import { cn } from "@/utils/cn";
import { Check, ChevronDown, Globe } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export function NavbarLanguageButton({ className }: { className?: string }) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SiteLanguageOption>(SITE_DEFAULT_LANGUAGE);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const selectLanguage = (option: SiteLanguageOption) => {
    setSelectedLanguage(option);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-nav transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:px-3 xl:text-[15px]"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
      >
        <Globe className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
        <span className="hidden whitespace-nowrap sm:inline">
          {selectedLanguage.label}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted transition-transform",
            isOpen && "rotate-180",
          )}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Available languages"
          className="absolute right-0 z-50 mt-2 min-w-[10.5rem] overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
        >
          {SITE_LANGUAGE_OPTIONS.map((option) => {
            const selected = option.value === selectedLanguage.value;

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                    selected
                      ? "bg-primary-light text-primary"
                      : "text-foreground hover:bg-primary-light hover:text-primary",
                  )}
                  onClick={() => selectLanguage(option)}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <Check
                      className="size-4 shrink-0"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
