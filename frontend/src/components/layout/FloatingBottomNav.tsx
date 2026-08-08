"use client";

import {
  getFloatingBottomNavItems,
  isFloatingBottomNavItemActive,
  type FloatingBottomNavAudience,
  type FloatingBottomNavItem,
} from "@/constants/floating-bottom-nav";
import { NAV_ITEM_PERMISSION_MODULE } from "@/constants/employer-rbac";
import { ROUTES } from "@/constants/routes";
import { useCanOptional } from "@/providers/employer-permission-provider";
import {
  fetchNotificationUnreadCount,
  notificationQueryKeys,
} from "@/services/notifications.service";
import {
  fetchSavedJobIds,
  savedJobsQueryKeys,
} from "@/services/saved-jobs.service";
import { cn } from "@/utils/cn";
import {
  EMPLOYER_ACCESS_TOKEN_STORAGE_KEY,
  EMPLOYER_AUTH_CHANGE_EVENT,
  getEmployerAccessToken,
} from "@/utils/employer-auth-storage";
import {
  JOB_SEEKER_ACCESS_TOKEN_STORAGE_KEY,
  JOB_SEEKER_AUTH_CHANGE_EVENT,
  getJobSeekerAccessToken,
} from "@/utils/job-seeker-auth-storage";
import {
  ensureSavedNavSeenInitialized,
  getUnseenSavedJobCount,
  markSavedJobsAsSeen,
  SAVED_NAV_SEEN_CHANGE_EVENT,
} from "@/utils/job-seeker-saved-nav-badge";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatBadgeCount(count: number): string {
  if (count > 999) {
    return "999+";
  }
  return String(count);
}

function resolveAudience(): FloatingBottomNavAudience {
  if (getEmployerAccessToken()) {
    return "employer";
  }
  if (getJobSeekerAccessToken()) {
    return "job-seeker";
  }
  return "public";
}

function resolveItemHref(
  item: FloatingBottomNavItem,
  audience: FloatingBottomNavAudience,
): string {
  if (item.id === "saved" && audience === "public") {
    return `${ROUTES.JOB_SEEKER_LOGIN}?returnUrl=${encodeURIComponent(ROUTES.JOB_SEEKER_SAVED_JOBS)}`;
  }
  if (item.id === "profile" && audience === "public") {
    return ROUTES.JOB_SEEKER_LOGIN;
  }
  return item.href;
}

/**
 * Mobile-only role-based floating bottom navigation.
 * Audience: public | job-seeker | employer (max 5 tabs).
 * Hides when the site `<footer>` intersects the viewport.
 */
export function FloatingBottomNav() {
  const pathname = usePathname() || "/";
  const [audience, setAudience] = useState<FloatingBottomNavAudience>("public");
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const { can, isLoading: permissionsLoading, hasProvider } = useCanOptional();

  useEffect(() => {
    const syncAuth = () => {
      setAudience(resolveAudience());
    };
    syncAuth();

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === JOB_SEEKER_ACCESS_TOKEN_STORAGE_KEY ||
        event.key === EMPLOYER_ACCESS_TOKEN_STORAGE_KEY
      ) {
        syncAuth();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(JOB_SEEKER_AUTH_CHANGE_EVENT, syncAuth);
    window.addEventListener(EMPLOYER_AUTH_CHANGE_EVENT, syncAuth);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(JOB_SEEKER_AUTH_CHANGE_EVENT, syncAuth);
      window.removeEventListener(EMPLOYER_AUTH_CHANGE_EVENT, syncAuth);
    };
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) {
      setIsFooterVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        setIsFooterVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.08,
        rootMargin: "0px",
      },
    );

    observer.observe(footer);
    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  const seekerNotificationsQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount("job-seeker"),
    queryFn: fetchNotificationUnreadCount,
    enabled: audience === "job-seeker",
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const savedIdsQuery = useQuery({
    queryKey: savedJobsQueryKeys.ids(),
    queryFn: fetchSavedJobIds,
    enabled: audience === "job-seeker",
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const [savedSeenVersion, setSavedSeenVersion] = useState(0);
  const isSavedJobsPage =
    pathname === ROUTES.JOB_SEEKER_SAVED_JOBS ||
    pathname.startsWith(`${ROUTES.JOB_SEEKER_SAVED_JOBS}/`);

  useEffect(() => {
    const onSeenChange = () => {
      setSavedSeenVersion((version) => version + 1);
    };
    window.addEventListener(SAVED_NAV_SEEN_CHANGE_EVENT, onSeenChange);
    return () => {
      window.removeEventListener(SAVED_NAV_SEEN_CHANGE_EVENT, onSeenChange);
    };
  }, []);

  useEffect(() => {
    if (audience !== "job-seeker" || !savedIdsQuery.data) {
      return;
    }

    if (isSavedJobsPage) {
      markSavedJobsAsSeen(savedIdsQuery.data);
      return;
    }

    ensureSavedNavSeenInitialized(savedIdsQuery.data);
  }, [audience, isSavedJobsPage, savedIdsQuery.data]);

  const badgeCounts = useMemo(
    () => ({
      messagesUnread: 0,
      savedJobs: isSavedJobsPage
        ? 0
        : getUnseenSavedJobCount(savedIdsQuery.data ?? []),
      notificationsUnread: seekerNotificationsQuery.data ?? 0,
    }),
    [
      isSavedJobsPage,
      savedIdsQuery.data,
      savedSeenVersion,
      seekerNotificationsQuery.data,
    ],
  );

  const navItems = useMemo(() => {
    const source = getFloatingBottomNavItems(audience);
    if (audience !== "employer") {
      return source;
    }

    return source.filter((item) => {
      const moduleKey =
        item.permissionModule ?? NAV_ITEM_PERMISSION_MODULE[item.id] ?? null;
      if (!moduleKey) {
        return true;
      }
      if (!hasProvider) {
        return true;
      }
      if (permissionsLoading) {
        return false;
      }
      return can(moduleKey, "read");
    });
  }, [audience, can, hasProvider, permissionsLoading]);

  const isVisible = !isFooterVisible;

  return (
    <nav
      aria-label="Mobile floating navigation"
      aria-hidden={!isVisible}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden",
        "mobile:block",
        "transition-[opacity,transform] duration-[200ms] ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto relative isolate w-full overflow-hidden",
          "rounded-t-[1.75rem] rounded-b-none",
          "border-t border-primary/15",
          "bg-surface",
          "shadow-[0_-6px_24px_rgba(14,133,133,0.12)]",
          "pb-[env(safe-area-inset-bottom)]",
          !isVisible && "pointer-events-none",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-job-card-selected-surface"
        />
        <div
          className="relative z-10 flex h-[78px] w-full items-stretch px-1"
          role="presentation"
        >
          {navItems.map((item) => {
            const href = resolveItemHref(item, audience);
            const active = isFloatingBottomNavItemActive(item, pathname);
            const Icon = item.icon;
            const badgeCount = item.badgeKey
              ? badgeCounts[item.badgeKey]
              : 0;

            return (
              <Link
                key={item.id}
                href={href}
                tabIndex={isVisible ? 0 : -1}
                aria-current={active ? "page" : undefined}
                aria-label={
                  badgeCount > 0
                    ? `${item.label}, ${badgeCount} unread`
                    : item.label
                }
                className={cn(
                  "relative flex min-w-0 flex-1 basis-0 flex-col items-center justify-center",
                  "pt-2.5 pb-1.5",
                  "transition-colors duration-[220ms] ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0 left-1/2 h-[3px] w-[30px] -translate-x-1/2 rounded-full bg-primary",
                    "transition-[opacity,transform] duration-[220ms] ease-out",
                    active
                      ? "scale-x-100 opacity-100"
                      : "scale-x-50 opacity-0",
                  )}
                />

                <span
                  className={cn(
                    "relative inline-flex size-[46px] items-center justify-center rounded-full",
                    "transition-[background-color,box-shadow,border-color,transform] duration-[220ms] ease-out",
                    active
                      ? "scale-105 border border-primary/20 bg-primary/10 shadow-[0_4px_12px_rgba(14,133,133,0.14)]"
                      : "scale-100 border border-transparent bg-transparent shadow-none",
                  )}
                >
                  {active ? (
                    <i
                      className={cn(
                        item.activeIconClass,
                        "text-[1.25rem] leading-none",
                      )}
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon
                      className="size-6 transition-colors duration-[220ms] ease-out"
                      strokeWidth={1.7}
                      fill="none"
                      aria-hidden="true"
                    />
                  )}
                  {badgeCount > 0 ? (
                    <span className="absolute top-0.5 right-0.5 z-10 min-w-[1.1rem] max-w-[2.25rem] truncate rounded-full bg-primary px-1 text-center text-[9px] font-bold leading-[1.1rem] text-surface tabular-nums ring-2 ring-surface">
                      {formatBadgeCount(badgeCount)}
                    </span>
                  ) : null}
                </span>

                <span
                  className={cn(
                    "mt-1 max-w-full truncate text-xs leading-none",
                    "transition-colors duration-[220ms] ease-out",
                    active
                      ? "font-semibold text-primary"
                      : "font-medium text-muted",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
