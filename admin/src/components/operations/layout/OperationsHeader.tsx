import { Bell, CalendarDays, ChevronDown, Filter, Globe, Menu, Moon, Sun } from "lucide-react";
import { useOperationsTheme } from "../../../providers/theme-provider";
import { cn } from "../../../utils/cn";

interface OperationsHeaderProps {
  title: string;
  subtitle?: string;
  onSidebarToggle: () => void;
}

export function OperationsHeader({
  title,
  subtitle,
  onSidebarToggle,
}: OperationsHeaderProps) {
  const { theme, setTheme } = useOperationsTheme();
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-3 sm:px-4 lg:px-5">
      <button
        type="button"
        onClick={onSidebarToggle}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold text-foreground sm:text-lg">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted sm:text-sm">{subtitle}</p>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:inline-flex"
          aria-label="Select language"
        >
          <Globe className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span>English</span>
          <ChevronDown
            className="size-3.5 shrink-0 text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="inline-flex size-10 items-center justify-center rounded-lg text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? (
            <Sun className="size-5" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Moon className="size-5" strokeWidth={2} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="relative inline-flex size-10 items-center justify-center rounded-lg text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Notifications, 12 unread"
        >
          <Bell className="size-5" strokeWidth={2} aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 inline-flex size-4 items-center justify-center rounded-full bg-pin-state text-[10px] font-bold text-surface">
            12
          </span>
        </button>

        <div
          className={cn(
            "hidden items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted xl:inline-flex",
          )}
        >
          <CalendarDays className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {formattedDate}
        </div>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-primary-soft transition-colors hover:border-primary-soft/40 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:px-3 sm:text-sm"
        >
          <Filter className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          Filters
        </button>
      </div>
    </header>
  );
}
