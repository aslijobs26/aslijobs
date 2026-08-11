"use client";

import {
  EMPLOYER_DASHBOARD_AVATAR_INITIALS,
  EMPLOYER_DASHBOARD_ACCOUNT_NAME,
  EMPLOYER_DASHBOARD_PROFILE_MENU_LOGOUT,
  EMPLOYER_DASHBOARD_ROLE_LABEL,
} from "@/constants/employer-dashboard";
import { ROUTES } from "@/constants/routes";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { useCanOptional } from "@/providers/employer-permission-provider";
import type { EmployerLoginPublic } from "@/services/employer-login.service";
import type {
  RbacSessionActor,
  TeamPermissionModule,
} from "@/types/employer-team";
import { cn } from "@/utils/cn";
import { clearEmployerClientSession } from "@/utils/employer-session";
import { resolveEmployerPosterImageUrl } from "@/utils/employer-poster-image";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import {
  Briefcase,
  Building2,
  ChevronDown,
  Globe,
  Home,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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

type ProfileMenuLink = {
  label: string;
  href: string;
  icon: typeof Briefcase;
  module: TeamPermissionModule | null;
};

const PROFILE_MENU_JOBS_LINK: ProfileMenuLink = {
  label: "My Jobs",
  href: ROUTES.EMPLOYER_JOBS,
  icon: Briefcase,
  module: "jobs",
};

const PROFILE_MENU_COMPANY_LINK: ProfileMenuLink = {
  label: "Company Profile",
  href: ROUTES.EMPLOYER_COMPANY_PROFILE,
  icon: Building2,
  module: "company_profile",
};

const PROFILE_MENU_MY_PROFILE_LINK: ProfileMenuLink = {
  label: "My Profile",
  href: ROUTES.EMPLOYER_TEAM_MEMBER_PROFILE,
  icon: User,
  module: null,
};

const PROFILE_MENU_SETTINGS_LINK: ProfileMenuLink = {
  label: "Settings",
  href: ROUTES.EMPLOYER_SETTINGS,
  icon: Settings,
  module: "settings",
};

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
  const fullName = `${employer.firstName} ${employer.lastName}`.trim();

  if (employer.accountType === "individual") {
    return (
      employer.establishmentName.trim() ||
      fullName ||
      EMPLOYER_DASHBOARD_ACCOUNT_NAME
    );
  }

  if (
    (employer.accountType === "company" ||
      employer.accountType === "consultancy") &&
    employer.companyName.trim()
  ) {
    return employer.companyName.trim();
  }

  if (fullName) {
    return fullName;
  }

  return employer.companyName.trim() || EMPLOYER_DASHBOARD_ACCOUNT_NAME;
}

function getEmployerInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return EMPLOYER_DASHBOARD_AVATAR_INITIALS;
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getEmployerAvatarUrl(employer: EmployerLoginPublic): string | null {
  return resolveEmployerPosterImageUrl(employer) || null;
}

function EmployerProfileAvatar({
  initials,
  imageUrl,
}: {
  initials: string;
  imageUrl: string | null;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const resolvedImageUrl = resolveMediaUrl(imageUrl);

  if (resolvedImageUrl && !hasImageError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- backend upload URL; not a Next Image domain asset
      <img
        src={resolvedImageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setHasImageError(true)}
        className="inline-flex size-9 shrink-0 rounded-full object-cover"
        aria-hidden="true"
      />
    );
  }

  return (
    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-surface">
      {initials}
    </span>
  );
}

type ProfileIdentity = {
  primaryName: string;
  secondaryLabel: string;
  avatarInitials: string;
  avatarImageUrl: string | null;
  actor: RbacSessionActor | null;
};

export function EmployerProfileMenu({
  className,
  compact = false,
  onLogout,
}: EmployerProfileMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const employerProfileQuery = useEmployerProfile();
  const {
    can,
    isLoading: permissionsLoading,
    hasProvider,
    session,
  } = useCanOptional();

  const identity = useMemo<ProfileIdentity>(() => {
    const employer = employerProfileQuery.data;
    const organizationName = employer
      ? getEmployerDisplayName(employer)
      : EMPLOYER_DASHBOARD_ACCOUNT_NAME;
    const employerAvatarUrl = employer ? getEmployerAvatarUrl(employer) : null;

    const actor =
      session?.principalType === "member" && session.actor
        ? session.actor
        : null;

    if (actor) {
      const memberName =
        actor.fullName.trim() || EMPLOYER_DASHBOARD_ACCOUNT_NAME;
      const roleName = actor.roleName.trim() || session?.roleName || "Member";
      const companyName =
        actor.companyName.trim() || organizationName || "Organization";

      return {
        // Company is the primary workplace identity for team members.
        primaryName: companyName,
        secondaryLabel: `${memberName} • ${roleName}`,
        avatarInitials: getEmployerInitials(memberName),
        avatarImageUrl: null,
        actor: {
          ...actor,
          fullName: memberName,
          roleName,
          companyName,
        },
      };
    }

    return {
      primaryName: organizationName,
      secondaryLabel: EMPLOYER_DASHBOARD_ROLE_LABEL,
      avatarInitials: getEmployerInitials(organizationName),
      avatarImageUrl: employerAvatarUrl,
      actor: null,
    };
  }, [employerProfileQuery.data, session]);

  const profileMenuLinks = useMemo(() => {
    const isTeamMember = Boolean(
      session?.principalType === "member" && session.actor,
    );

    const primaryLink =
      isEmployerWorkspacePath(pathname)
        ? {
            label: "Website",
            href: ROUTES.HOME,
            icon: Globe,
            module: null as TeamPermissionModule | null,
          }
        : !hasProvider || can("dashboard", "read")
          ? {
              label: "Dashboard",
              href: ROUTES.EMPLOYER_DASHBOARD,
              icon: Home,
              module: "dashboard" as TeamPermissionModule | null,
            }
          : {
              label: "Website",
              href: ROUTES.HOME,
              icon: Globe,
              module: null as TeamPermissionModule | null,
            };

    const secondaryLinks: ProfileMenuLink[] = isTeamMember
      ? [
          PROFILE_MENU_JOBS_LINK,
          PROFILE_MENU_MY_PROFILE_LINK,
          PROFILE_MENU_SETTINGS_LINK,
        ]
      : [
          PROFILE_MENU_JOBS_LINK,
          employerProfileQuery.data?.accountType === "individual"
            ? {
                ...PROFILE_MENU_COMPANY_LINK,
                label: "Individual Profile",
              }
            : PROFILE_MENU_COMPANY_LINK,
          PROFILE_MENU_SETTINGS_LINK,
        ];

    const filteredSecondary = secondaryLinks.filter((item) => {
      if (!item.module) {
        return true;
      }
      // Public site has no RBAC provider — show links; workspace route guard enforces.
      if (!hasProvider) {
        return true;
      }
      if (permissionsLoading) {
        return false;
      }
      return can(item.module, "read");
    });

    return [primaryLink, ...filteredSecondary];
  }, [
    can,
    employerProfileQuery.data?.accountType,
    hasProvider,
    pathname,
    permissionsLoading,
    session,
  ]);

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
    void (async () => {
      await clearEmployerClientSession(queryClient);
      onLogout?.();
      router.replace(ROUTES.HOME);
    })();
  };

  const actor = identity.actor;
  const ariaLabel = actor
    ? `Team member profile menu for ${actor.fullName} at ${identity.primaryName}`
    : "Employer profile menu";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <EmployerProfileAvatar
          initials={identity.avatarInitials}
          imageUrl={identity.avatarImageUrl}
        />

        {!compact ? (
          <>
            <span className="hidden min-w-0 text-left md:block">
              <span className="block max-w-[9.5rem] truncate text-sm font-semibold text-foreground">
                {identity.primaryName}
              </span>
              <span className="block max-w-[9.5rem] truncate text-xs text-muted">
                {identity.secondaryLabel}
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
        aria-label={ariaLabel}
        className={cn(
          "absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border border-border-subtle bg-surface p-1.5 shadow-sm transition-[opacity,transform,visibility] duration-200 ease-out",
          isOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible -translate-y-1 scale-95 opacity-0 pointer-events-none",
        )}
      >
        <div className="border-b border-border-subtle px-3 py-2">
          {actor ? (
            <div className="min-w-0">
              <div className="mb-2">
                <EmployerProfileAvatar
                  initials={identity.avatarInitials}
                  imageUrl={identity.avatarImageUrl}
                />
              </div>
              <p className="truncate text-sm font-semibold text-foreground">
                {actor.companyName}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {identity.secondaryLabel}
              </p>
            </div>
          ) : (
            <>
              <p className="truncate text-sm font-semibold text-foreground">
                {identity.primaryName}
              </p>
              <p className="truncate text-xs text-muted">
                {EMPLOYER_DASHBOARD_ROLE_LABEL}
              </p>
            </>
          )}
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
