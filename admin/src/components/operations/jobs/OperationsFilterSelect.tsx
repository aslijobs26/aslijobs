import { Check, ChevronDown, Search } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../utils/cn";

export interface OperationsFilterSelectOption {
  value: string;
  label: string;
}

interface OperationsFilterSelectProps {
  id?: string;
  label: string;
  value: string;
  options: readonly OperationsFilterSelectOption[];
  onChange: (value: string) => void;
  /** Hide in-panel search (use for short option lists). */
  hideSearch?: boolean;
  className?: string;
  triggerClassName?: string;
}

type DropdownPlacement = "down" | "up";

const DROPDOWN_GAP_PX = 6;
const DROPDOWN_PANEL_ESTIMATED_HEIGHT_PX = 240;
const DROPDOWN_PANEL_COMPACT_ROW_HEIGHT_PX = 32;

const triggerBaseClassName =
  "ops-brand-border-glow flex h-8 w-full min-w-[7.5rem] cursor-pointer items-center justify-between gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 text-left text-[11px] font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function normalizeOptionKey(value: string) {
  return value.trim().toLowerCase();
}

function estimatePanelHeight(
  hideSearch: boolean,
  optionCount: number,
): number {
  if (hideSearch) {
    return Math.min(
      optionCount * DROPDOWN_PANEL_COMPACT_ROW_HEIGHT_PX + 12,
      160,
    );
  }

  return DROPDOWN_PANEL_ESTIMATED_HEIGHT_PX;
}

export function OperationsFilterSelect({
  id: idProp,
  label,
  value,
  options,
  onChange,
  hideSearch = false,
  className,
  triggerClassName,
}: OperationsFilterSelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState<DropdownPlacement>("down");
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});

  const selectedOption = options.find(
    (option) => normalizeOptionKey(option.value) === normalizeOptionKey(value),
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.value}`.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  const displayValue = selectedOption?.label ?? label;
  const isPlaceholder = !selectedOption || selectedOption.value === "";
  const panelHeightEstimate = estimatePanelHeight(
    hideSearch,
    filteredOptions.length || 1,
  );

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUp =
        spaceBelow < panelHeightEstimate + DROPDOWN_GAP_PX &&
        spaceAbove > spaceBelow;

      setPlacement(shouldOpenUp ? "up" : "down");
      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 1000,
        ...(shouldOpenUp
          ? { bottom: window.innerHeight - rect.top + DROPDOWN_GAP_PX }
          : { top: rect.bottom + DROPDOWN_GAP_PX }),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, filteredOptions.length, panelHeightEstimate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
      setQuery("");
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
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery("");
  };

  const dropdownPanel = isOpen ? (
    <div
      ref={panelRef}
      style={dropdownStyle}
      className="overflow-hidden rounded-md border border-border bg-surface shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
      data-dropdown-placement={placement}
    >
      {hideSearch ? null : (
        <div className="flex items-center gap-2 border-b border-border-subtle px-2.5 py-2">
          <Search
            className="size-3.5 shrink-0 text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            className="w-full border-0 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted"
            autoFocus
            aria-label={`Search ${label}`}
          />
        </div>
      )}

      <ul
        id={listboxId}
        role="listbox"
        aria-label={label}
        className="m-0 max-h-[min(14rem,40vh)] list-none overflow-y-auto overscroll-contain p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {filteredOptions.length === 0 ? (
          <li className="px-2.5 py-2 text-[11px] text-muted">No results found</li>
        ) : (
          filteredOptions.map((option) => {
            const isSelected =
              normalizeOptionKey(option.value) === normalizeOptionKey(value);

            return (
              <li
                key={option.value || "__all__"}
                role="option"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-[11px] text-foreground transition-colors hover:bg-primary-light hover:text-primary",
                    isSelected && "bg-primary-light text-primary",
                  )}
                  onClick={() => selectOption(option.value)}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {option.label}
                  </span>
                  {isSelected ? (
                    <Check
                      className="size-3.5 shrink-0"
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
  ) : null;

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={cn(
          triggerBaseClassName,
          isPlaceholder && "text-muted",
          triggerClassName,
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={label}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="min-w-0 flex-1 truncate">{displayValue}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-foreground/70 transition-transform",
            isOpen && "rotate-180",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {typeof document !== "undefined" && dropdownPanel
        ? createPortal(dropdownPanel, document.body)
        : null}
    </div>
  );
}
