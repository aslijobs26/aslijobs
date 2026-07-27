"use client";

import { ROUTES } from "@/constants/routes";
import { fetchAuthenticatedJobSeeker } from "@/services/job-seeker-login.service";
import { cn } from "@/utils/cn";
import { clearJobSeekerAuthSession } from "@/utils/job-seeker-auth-storage";
import {
  Bookmark,
  Bell,
  Briefcase,
  ChevronDown,
  FileText,
  LogOut,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type JobSeekerProfileMenuProps = {
  className?: string;
  onLogout?: () => void;
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "JS";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function JobSeekerProfileMenu({
  className,
  onLogout,
}: JobSeekerProfileMenuProps) {
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Job Seeker");

  useEffect(() => {
    let cancelled = false;

    void fetchAuthenticatedJobSeeker()
      .then((data) => {
        if (cancelled) {
          return;
        }
        const name = data.jobSeeker.fullName.trim();
        if (name) {
          setDisplayName(name);
        }
      })
      .catch(() => {
        // Keep fallback label if profile fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = () => {
    clearJobSeekerAuthSession();
    setIsOpen(false);
    onLogout?.();
    router.replace(ROUTES.HOME);
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const initials = getInitials(displayName);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Job seeker profile menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-surface"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9.5rem] truncate text-sm font-semibold text-foreground">
            {displayName}
          </span>
          <span className="block truncate text-xs text-muted">Job Seeker</span>
        </span>
        <ChevronDown
          className={cn(
            "hidden size-4 shrink-0 text-muted transition-transform duration-200 sm:block",
            isOpen && "rotate-180",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_8px_24px_rgba(26,43,60,0.12)]"
        >
          <div className="border-b border-border-subtle px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-xs text-muted">Job Seeker</p>
          </div>

          <div className="p-1.5">
            <Link
              href={ROUTES.JOB_SEEKER_DASHBOARD}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setIsOpen(false)}
            >
              <UserRound className="size-4 text-primary" aria-hidden="true" />
              Profile
            </Link>
            <Link
              href={ROUTES.JOB_SEEKER_SAVED_JOBS}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setIsOpen(false)}
            >
              <Bookmark className="size-4 text-primary" aria-hidden="true" />
              Saved Jobs
            </Link>
            <Link
              href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setIsOpen(false)}
            >
              <Briefcase className="size-4 text-primary" aria-hidden="true" />
              Applied Jobs
            </Link>
            <Link
              href={ROUTES.JOB_SEEKER_MY_RESUME}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setIsOpen(false)}
            >
              <FileText className="size-4 text-primary" aria-hidden="true" />
              My Resume
            </Link>
            <Link
              href={ROUTES.JOB_SEEKER_NOTIFICATIONS}
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setIsOpen(false)}
            >
              <Bell className="size-4 text-primary" aria-hidden="true" />
              Notifications
            </Link>
          </div>

          <div className="border-t border-border-subtle p-1.5">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
              onClick={handleLogout}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
