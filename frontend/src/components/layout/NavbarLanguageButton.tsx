"use client";

import {
  SITE_LANGUAGE_OPTIONS,
  type SiteLanguageOption,
} from "@/constants/site-language";
import { useSiteLanguage, writeSiteLanguage } from "@/i18n/site-language";
import { useTranslate } from "@/i18n/translate";
import {
  computeAnchoredDropdownPosition,
  readSafeAreaInsets,
  readVisibleViewportSize,
  type AnchoredDropdownPosition,
} from "@/utils/anchored-dropdown-position";
import { cn } from "@/utils/cn";
import { Check, ChevronDown, Globe } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

export function NavbarLanguageButton({ className }: { className?: string }) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<AnchoredDropdownPosition | null>(
    null,
  );
  const selectedLanguage = useSiteLanguage();
  const t = useTranslate();

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const list = listRef.current;
    if (!trigger || !list) {
      return;
    }

    const appliedMaxWidth = list.style.maxWidth;
    list.style.maxWidth = "none";
    const contentWidth = list.offsetWidth;
    list.style.maxWidth = appliedMaxWidth;

    const viewport = readVisibleViewportSize();
    setPosition(
      computeAnchoredDropdownPosition({
        anchorRect: trigger.getBoundingClientRect(),
        contentWidth,
        contentHeight: list.scrollHeight,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        insets: readSafeAreaInsets(),
      }),
    );
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();

    const frame = window.requestAnimationFrame(() => {
      const list = listRef.current;
      const selectedOption = list?.querySelector<HTMLElement>(
        '[aria-selected="true"]',
      );
      if (!list || !selectedOption) {
        return;
      }
      const optionBottom = selectedOption.offsetTop + selectedOption.offsetHeight;
      if (optionBottom > list.clientHeight) {
        list.scrollTop = optionBottom - list.clientHeight;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleViewportChange = () => updatePosition();
    const handleScroll = (event: Event) => {
      if (event.target !== listRef.current) {
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

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const selectLanguage = (option: SiteLanguageOption) => {
    writeSiteLanguage(option);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md border border-border-subtle px-2 text-xs font-medium text-nav transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 mobile:h-8 mobile:min-h-8 mobile:px-2 sm:h-10 sm:gap-1.5 sm:px-3 sm:text-sm xl:text-[15px]"
        aria-label={t("navbar.selectLanguage")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
      >
        <Globe
          className="hidden size-4 shrink-0 sm:inline"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="whitespace-nowrap sm:hidden">Language</span>
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

      {/* Portaled so the sticky header's overflow clip and stacking context cannot cut it off;
          z-[55] sits above the header, bottom nav and WhatsApp button (z-50) and below dialogs (z-[60]+). */}
      {isOpen
        ? createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={t("navbar.availableLanguages")}
              style={
                position
                  ? {
                      top: position.top,
                      left: position.left,
                      maxHeight: position.maxHeight,
                      maxWidth: position.maxWidth,
                    }
                  : { top: 0, left: 0, visibility: "hidden" }
              }
              className="fixed z-[55] min-w-[10.5rem] overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
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
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
