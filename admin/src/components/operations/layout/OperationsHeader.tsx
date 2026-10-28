import {
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  MOCK_OPERATIONS_USER,
} from "../../../constants/operations-navigation";
import type { OperationsLayoutDensity } from "../../../constants/operations-layout";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
import { useOperationsTheme } from "../../../providers/theme-provider";
import { logoutOperationsTeam } from "../../../services/operations-auth.service";
import { cn } from "../../../utils/cn";
import { getOperationsAuthUser } from "../../../utils/operations-auth-storage";
import { clearOperationsClientSession } from "../../../utils/operations-session";
import { OperationsNotificationsMenu } from "./OperationsNotificationsMenu";

export type OperationsHeaderVariant = "default" | "command";

interface OperationsHeaderProps {
  title: string;
  subtitle?: string;
  onSidebarToggle: () => void;
  density?: OperationsLayoutDensity;
  variant?: OperationsHeaderVariant;
}

const iconButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-md text-nav transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function OperationsHeader({
  title,
  subtitle,
  onSidebarToggle,
  density = "compact",
  variant = "default",
}: OperationsHeaderProps) {
  const { theme, setTheme } = useOperationsTheme();
  const isCompact = density === "compact";
  const isCommand = variant === "command";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionUser = getOperationsAuthUser();
  const { user } = useOperationsPermissions();
  const resolvedUser = user ?? sessionUser;
  const displayName = resolvedUser?.fullName || MOCK_OPERATIONS_USER.name;
  const displayRole =
    resolvedUser?.roleName ||
    (resolvedUser?.isSuperAdmin || resolvedUser?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : MOCK_OPERATIONS_USER.role);
  const displayInitials = resolvedUser
    ? getInitials(resolvedUser.fullName)
    : MOCK_OPERATIONS_USER.initials;

  const [searchValue, setSearchValue] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuId = useId();

  const logoutMutation = useMutation({
    mutationFn: logoutOperationsTeam,
    onSettled: () => {
      clearOperationsClientSession(queryClient);
      navigate(OPERATIONS_ROUTES.LOGIN, { replace: true });
    },
  });

  useEffect(() => {
    if (!userMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [userMenuOpen]);

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    navigate(
      `${OPERATIONS_ROUTES.CANDIDATES}?search=${encodeURIComponent(q)}`,
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex min-w-0 shrink-0 items-center border-b border-border-subtle bg-surface/95 backdrop-blur-sm",
        isCompact
          ? "h-14 gap-2 px-2 sm:gap-3 sm:px-3 lg:px-4"
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

      {!isCommand ? (
        <div className="min-w-0 flex-1 overflow-hidden lg:max-w-xs">
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
      ) : null}

      <form
        onSubmit={handleSearchSubmit}
        className={cn(
          "min-w-0 flex-1",
          !isCommand && "hidden md:block",
        )}
        role="search"
      >
        <label htmlFor="ops-global-search" className="sr-only">
          Global search
        </label>
        <div className="relative mx-auto w-full max-w-2xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            id="ops-global-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search candidates, employers, jobs, work items, conversations..."
            className="h-10 w-full rounded-xl border border-border-subtle bg-surface py-2 pl-9 pr-3 text-[12px] text-foreground shadow-sm outline-none placeholder:text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>

      <div
        className={cn(
          "ml-auto flex shrink-0 items-center",
          isCompact ? "gap-1 sm:gap-1.5 lg:gap-2" : "gap-1.5 sm:gap-2.5",
        )}
      >
        <button
          type="button"
          className={cn(
            "hidden items-center rounded-lg border border-border-subtle bg-hero-bg/50 font-medium text-nav transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:inline-flex",
            isCompact
              ? "h-9 gap-1.5 px-2.5 text-[11px]"
              : "h-9 gap-1.5 px-3 text-xs",
          )}
          aria-label="Global scope India IST"
        >
          <Globe
            className="size-3.5 shrink-0 text-primary"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>India (IST)</span>
          <ChevronDown
            className="size-3.5 shrink-0 text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            iconButtonClassName,
            "touch-manipulation",
            isCompact ? "size-8" : "size-9",
          )}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? (
            <Sun className="size-3.5" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Moon className="size-3.5" strokeWidth={2} aria-hidden="true" />
          )}
        </button>

        <OperationsNotificationsMenu
          density={density}
          iconButtonClassName={iconButtonClassName}
        />

        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            className={cn(
              "inline-flex max-w-[11rem] items-center gap-2 rounded-lg border border-border-subtle bg-surface px-1.5 py-1 transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:max-w-[14rem] sm:px-2",
            )}
            aria-expanded={userMenuOpen}
            aria-controls={userMenuId}
            aria-haspopup="menu"
            onClick={() => setUserMenuOpen((open) => !open)}
          >
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-semibold text-primary">
              {displayInitials}
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block truncate text-[12px] font-semibold text-foreground">
                {displayName}
              </span>
              <span className="block truncate text-[10px] text-muted">
                {displayRole}
              </span>
            </span>
            <ChevronDown
              className="hidden size-3.5 shrink-0 text-muted sm:block"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>

          {userMenuOpen ? (
            <div
              id={userMenuId}
              role="menu"
              className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[11rem] overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-danger hover:bg-danger/5"
                onClick={() => {
                  setUserMenuOpen(false);
                  logoutMutation.mutate();
                }}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="size-3.5" strokeWidth={2} aria-hidden="true" />
                {logoutMutation.isPending ? "Signing out…" : "Log out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
