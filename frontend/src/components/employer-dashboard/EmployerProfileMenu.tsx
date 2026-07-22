"use client";

import {
  EMPLOYER_DASHBOARD_AVATAR_INITIALS,
  EMPLOYER_DASHBOARD_COMPANY_NAME,
  EMPLOYER_DASHBOARD_PROFILE_MENU_LOGOUT,
  EMPLOYER_DASHBOARD_ROLE_LABEL,
} from "@/constants/employer-dashboard";
import { ROUTES } from "@/constants/routes";
import {
  fetchAuthenticatedEmployer,
  type EmployerLoginPublic,
} from "@/services/employer-login.service";
import { cn } from "@/utils/cn";
import {
  clearEmployerAuthSession,
  getEmployerAccessToken,
} from "@/utils/employer-auth-storage";
import {
  Briefcase,
  Building2,
  ChevronDown,
  Globe,
  Home,
  LogOut,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type EmployerProfileMenuProps = {
  className?: string;
  compact?: boolean;
  onLogout?: () => void;
};

const PROFILE_MENU_SECONDARY_LINKS = [
  {
    label: "My Jobs",
    href: ROUTES.EMPLOYER_JOBS,
    icon: Briefcase,
  },
  {
    label: "Company Profile",
    href: ROUTES.EMPLOYER_COMPANY_PROFILE,
    icon: Building2,
  },
  {
    label: "Settings",
    href: ROUTES.EMPLOYER_SETTINGS,
    icon: Settings,
  },
] as const;

function isEmployerWorkspacePath(pathname: string): boolean {
  if (
    pathname === ROUTES.EMPLOYER_LOGIN ||
    pathname.startsWith(`${ROUTES.EMPLOYER_LOGIN}/`)
  ) {
    return false;
  }

  if (
    pathname === ROUTES.EMPLOYER_REGISTER ||
    pathname.startsWith(`${ROUTES.EMPLOYER_REGISTER}/`)
  ) {
    return false;
  }

  return pathname === "/employer" || pathname.startsWith("/employer/");
}

function getEmployerDisplayName(employer: EmployerLoginPublic): string {
  if (
    (employer.accountType === "company" ||
      employer.accountType === "consultancy") &&
    employer.companyName.trim()
  ) {
    return employer.companyName.trim();
  }

  const fullName = `${employer.firstName} ${employer.lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  return employer.companyName.trim() || EMPLOYER_DASHBOARD_COMPANY_NAME;
}

function getCompanyStartingInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return EMPLOYER_DASHBOARD_AVATAR_INITIALS;
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function EmployerProfileMenu({
  className,
  compact = false,
  onLogout,
}: EmployerProfileMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState(
    EMPLOYER_DASHBOARD_COMPANY_NAME,
  );
  const [avatarInitials, setAvatarInitials] = useState(
    EMPLOYER_DASHBOARD_AVATAR_INITIALS,
  );

  const profileMenuLinks = useMemo(() => {
    const primaryLink = isEmployerWorkspacePath(pathname)
      ? {
          label: "Website",
          href: ROUTES.HOME,
          icon: Globe,
        }
      : {
          label: "Dashboard",
          href: ROUTES.EMPLOYER_DASHBOARD,
          icon: Home,
        };

    return [primaryLink, ...PROFILE_MENU_SECONDARY_LINKS];
  }, [pathname]);

  useEffect(() => {
    if (!getEmployerAccessToken()) {
      return;
    }

    let cancelled = false;

    void fetchAuthenticatedEmployer()
      .then(({ employer }) => {
        if (cancelled) {
          return;
        }

        const displayName = getEmployerDisplayName(employer);
        setCompanyName(displayName);
        setAvatarInitials(getCompanyStartingInitials(displayName));
      })
      .catch(() => {
        // Keep fallback placeholder values when session is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    clearEmployerAuthSession();
    onLogout?.();
    router.replace(ROUTES.HOME);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Employer profile menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-surface">
          {avatarInitials}
        </span>

        {!compact ? (
          <>
            <span className="hidden min-w-0 text-left md:block">
              <span className="block max-w-[9.5rem] truncate text-sm font-semibold text-foreground">
                {companyName}
              </span>
              <span className="block truncate text-xs text-muted">
                {EMPLOYER_DASHBOARD_ROLE_LABEL}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "hidden size-4 shrink-0 text-muted transition-transform duration-200 md:block",
                isOpen && "rotate-180",
              )}
              strokeWidth={2}
              aria-hidden="true"
            />
          </>
        ) : null}
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label="Employer profile options"
        className={cn(
          "absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-lg border border-border-subtle bg-surface p-1.5 shadow-sm transition-[opacity,transform,visibility] duration-200 ease-out",
          isOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible -translate-y-1 scale-95 opacity-0 pointer-events-none",
        )}
      >
        <div className="border-b border-border-subtle px-3 py-2 md:hidden">
          <p className="truncate text-sm font-semibold text-foreground">
            {companyName}
          </p>
          <p className="truncate text-xs text-muted">
            {EMPLOYER_DASHBOARD_ROLE_LABEL}
          </p>
        </div>

        {profileMenuLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setIsOpen(false)}
            >
              <Icon
                className="size-4 shrink-0 text-muted"
                strokeWidth={2}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}

        <div className="my-1 border-t border-border-subtle" role="separator" />

        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onClick={handleLogout}
        >
          <LogOut className="size-4 shrink-0 text-muted" strokeWidth={2} aria-hidden="true" />
          {EMPLOYER_DASHBOARD_PROFILE_MENU_LOGOUT}
        </button>
      </div>
    </div>
  );
}
