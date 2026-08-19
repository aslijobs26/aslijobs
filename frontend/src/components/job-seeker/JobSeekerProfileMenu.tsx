"use client";

import { ROUTES } from "@/constants/routes";
import { useJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import { cn } from "@/utils/cn";
import { clearJobSeekerClientSession } from "@/utils/job-seeker-session";
import { getInitials } from "@/utils/job-seeker-profile";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import {
  Bookmark,
  Bell,
  Briefcase,
  ChevronDown,
  FileText,
  LogOut,
  UserRound,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
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

export function JobSeekerProfileMenu({
  className,
  onLogout,
}: JobSeekerProfileMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const profileQuery = useJobSeekerProfile();

  const displayName =
    profileQuery.data?.fullName?.trim() || "Job Seeker";
  const photoUrl = profileQuery.data?.profilePhoto?.url
    ? resolveMediaUrl(profileQuery.data.profilePhoto.url)
    : null;
  const showPhoto = Boolean(photoUrl) && !photoFailed;

  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUrl]);

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
    void clearJobSeekerClientSession(queryClient).finally(() => {
      setIsOpen(false);
      onLogout?.();
      router.replace(ROUTES.HOME);
    });
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
          className="relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-bold text-surface sm:size-9 sm:text-sm"
          aria-hidden="true"
        >
          {showPhoto && photoUrl ? (
            <Image
              src={photoUrl}
              alt=""
              width={36}
              height={36}
              className="size-full object-cover"
              unoptimized
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            initials
          )}
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
          className="absolute right-0 z-50 mt-2 w-48 sm:mt-3 sm:w-56"
        >
          {/* V-shaped caret pointing up to the profile trigger */}
          <span
            className="pointer-events-none absolute -top-1.5 right-5 z-10 size-2.5 rotate-45 border-t border-l border-border-subtle bg-surface shadow-[-1px_-1px_2px_rgba(26,43,60,0.04)] sm:right-7 sm:size-3"
            aria-hidden="true"
          />

          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-[0_8px_24px_rgba(26,43,60,0.12)] sm:rounded-xl">
            <div className="p-1 sm:p-1.5">
              <Link
                href={ROUTES.JOB_SEEKER_PROFILE}
                role="menuitem"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm"
                onClick={() => setIsOpen(false)}
              >
                <UserRound
                  className="size-3.5 text-primary sm:size-4"
                  aria-hidden="true"
                />
                Profile
              </Link>
              <Link
                href={ROUTES.JOB_SEEKER_SAVED_JOBS}
                role="menuitem"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm"
                onClick={() => setIsOpen(false)}
              >
                <Bookmark
                  className="size-3.5 text-primary sm:size-4"
                  aria-hidden="true"
                />
                Saved Jobs
              </Link>
              <Link
                href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
                role="menuitem"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm"
                onClick={() => setIsOpen(false)}
              >
                <Briefcase
                  className="size-3.5 text-primary sm:size-4"
                  aria-hidden="true"
                />
                My Applications
              </Link>
              <Link
                href={ROUTES.JOB_SEEKER_MY_RESUME}
                role="menuitem"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm"
                onClick={() => setIsOpen(false)}
              >
                <FileText
                  className="size-3.5 text-primary sm:size-4"
                  aria-hidden="true"
                />
                My Resume
              </Link>
              <Link
                href={ROUTES.JOB_SEEKER_NOTIFICATIONS}
                role="menuitem"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm"
                onClick={() => setIsOpen(false)}
              >
                <Bell
                  className="size-3.5 text-primary sm:size-4"
                  aria-hidden="true"
                />
                Notifications
              </Link>
            </div>

            <div className="border-t border-border-subtle p-1 sm:p-1.5">
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm"
                onClick={handleLogout}
              >
                <LogOut className="size-3.5 sm:size-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
