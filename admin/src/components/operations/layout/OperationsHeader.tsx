import {
  Bell,
  CalendarDays,
  ChevronDown,
  Filter,
  Globe,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import type { OperationsLayoutDensity } from "../../../constants/operations-layout";
import { useOperationsTheme } from "../../../providers/theme-provider";
import { cn } from "../../../utils/cn";

interface OperationsHeaderProps {
  title: string;
  subtitle?: string;
  onSidebarToggle: () => void;
  density?: OperationsLayoutDensity;
}

const iconButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-md text-nav transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function OperationsHeader({
  title,
  subtitle,
  onSidebarToggle,
  density = "compact",
}: OperationsHeaderProps) {
  const { theme, setTheme } = useOperationsTheme();
  const isCompact = density === "compact";
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex min-w-0 shrink-0 items-center border-b border-border-subtle bg-surface/95 backdrop-blur-sm",
        isCompact
          ? "h-12 gap-1.5 px-2 sm:gap-2.5 sm:px-3 lg:px-3.5"
          : "h-14 gap-2 px-2.5 sm:h-16 sm:gap-3 sm:px-4 lg:px-5",
      )}
    >
      <button
        type="button"
        onClick={onSidebarToggle}
        className={cn(
          iconButtonClassName,
          "touch-manipulation",
          isCompact ? "size-9 sm:size-8" : "size-10",
        )}
        aria-label="Toggle sidebar"
      >
        <Menu
          className={isCompact ? "size-4" : "size-5"}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      <div className="min-w-0 flex-1 overflow-hidden">
        <h1
          className={cn(
            "truncate font-semibold tracking-tight text-foreground",
            isCompact ? "text-sm sm:text-[15px]" : "text-base sm:text-lg",
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mt-0.5 hidden min-w-0 truncate text-muted sm:block",
              isCompact ? "text-[11px] leading-tight" : "text-xs sm:text-sm",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "ml-auto flex shrink-0 items-center",
          isCompact ? "gap-1 sm:gap-1.5 lg:gap-2" : "gap-1.5 sm:gap-2.5",
        )}
      >
        <time
          dateTime={new Date().toISOString().slice(0, 10)}
          className={cn(
            "hidden items-center rounded-md border border-border-subtle bg-hero-bg/60 font-medium text-muted xl:inline-flex",
            isCompact
              ? "h-8 gap-1.5 px-2.5 text-[11px]"
              : "h-9 gap-1.5 px-3 text-xs",
          )}
        >
          <CalendarDays
            className={cn("shrink-0 text-primary-soft", isCompact ? "size-3.5" : "size-4")}
            strokeWidth={2}
            aria-hidden="true"
          />
          {formattedDate}
        </time>

        <div
          className={cn(
            "flex items-center rounded-lg border border-border-subtle bg-hero-bg/40 p-0.5",
          )}
          role="group"
          aria-label="Quick tools"
        >
          <button
            type="button"
            className={cn(
              "hidden items-center rounded-md font-medium text-nav transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:inline-flex",
              isCompact
                ? "h-7 gap-1 px-2 text-[11px]"
                : "h-8 gap-1.5 px-2.5 text-xs",
            )}
            aria-label="Select language"
          >
            <Globe
              className={cn("shrink-0", isCompact ? "size-3.5" : "size-4")}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>EN</span>
            <ChevronDown
              className={cn("shrink-0 text-muted", isCompact ? "size-3" : "size-3.5")}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              iconButtonClassName,
              "touch-manipulation hover:bg-surface",
              isCompact ? "size-8 sm:size-7" : "size-8",
            )}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
          >
            {theme === "dark" ? (
              <Sun
                className={isCompact ? "size-3.5" : "size-4"}
                strokeWidth={2}
                aria-hidden="true"
              />
            ) : (
              <Moon
                className={isCompact ? "size-3.5" : "size-4"}
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
          </button>

          <button
            type="button"
            className={cn(
              iconButtonClassName,
              "relative touch-manipulation hover:bg-surface",
              isCompact ? "size-8 sm:size-7" : "size-8",
            )}
            aria-label="Notifications, 12 unread"
          >
            <Bell
              className={isCompact ? "size-3.5" : "size-4"}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 inline-flex items-center justify-center rounded-full bg-pin-state font-bold text-surface ring-2 ring-surface",
                isCompact
                  ? "h-3.5 min-w-3.5 px-0.5 text-[8px]"
                  : "h-4 min-w-4 px-0.5 text-[9px]",
              )}
            >
              12
            </span>
          </button>
        </div>

        <button
          type="button"
          className={cn(
            "hidden touch-manipulation items-center rounded-md border border-border-subtle bg-surface font-semibold text-foreground transition-colors sm:inline-flex",
            "hover:border-primary-soft/40 hover:bg-primary-light hover:text-primary-soft",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            isCompact
              ? "h-8 gap-1.5 px-2.5 text-[11px]"
              : "h-9 gap-1.5 px-3 text-xs sm:text-sm",
          )}
        >
          <Filter
            className={cn("shrink-0", isCompact ? "size-3.5" : "size-4")}
            strokeWidth={2}
            aria-hidden="true"
          />
          Filters
        </button>
      </div>
    </header>
  );
}
