import { Bell } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { OperationsLayoutDensity } from "../../../constants/operations-layout";
import {
  useMarkOperationsNotificationRead,
  useOperationsRegistrationBadges,
  useOperationsRegistrationNotifications,
} from "../../../hooks/use-operations-registration-awareness";
import type { OperationsNotificationListItem } from "../../../types/operations-registration-awareness";
import { cn } from "../../../utils/cn";

function formatNotificationTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function NotificationRow({
  item,
  onSelect,
}: {
  item: OperationsNotificationListItem;
  onSelect: (item: OperationsNotificationListItem) => void;
}) {
  return (
    <li>
      <Link
        to={item.actionPath}
        onClick={() => onSelect(item)}
        className={cn(
          "block px-3 py-2.5 transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
          !item.isRead && "bg-primary-light/25",
        )}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-semibold text-foreground">
              {item.title}
            </span>
            <span className="mt-0.5 block line-clamp-2 text-[11px] text-muted">
              {item.body}
            </span>
          </span>
          {!item.isRead ? (
            <span
              className="mt-1 size-1.5 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          ) : null}
        </span>
        <span className="mt-1.5 block text-[10px] text-muted">
          {formatNotificationTime(item.createdAt)}
          {item.actorName ? ` · ${item.actorName}` : ""}
        </span>
      </Link>
    </li>
  );
}

interface OperationsNotificationsMenuProps {
  density?: OperationsLayoutDensity;
  iconButtonClassName: string;
}

export function OperationsNotificationsMenu({
  density = "compact",
  iconButtonClassName,
}: OperationsNotificationsMenuProps) {
  const isCompact = density === "compact";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const badgesQuery = useOperationsRegistrationBadges();
  const notificationsQuery = useOperationsRegistrationNotifications(20, {
    enabled: open,
  });
  const markReadMutation = useMarkOperationsNotificationRead();

  const unreadCount =
    badgesQuery.data?.unreadNotifications ??
    notificationsQuery.data?.unreadCount ??
    0;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (item: OperationsNotificationListItem) => {
    setOpen(false);
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
  };

  const ariaLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications, no unread";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className={cn(
          iconButtonClassName,
          "relative touch-manipulation",
          isCompact ? "size-8" : "size-9",
        )}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="size-3.5" strokeWidth={2} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-surface ring-2 ring-surface">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2.5">
            <p className="text-[12px] font-semibold text-foreground">
              Notifications
            </p>
            {unreadCount > 0 ? (
              <span className="text-[10px] font-semibold tabular-nums text-muted">
                {unreadCount} unread
              </span>
            ) : null}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {notificationsQuery.isLoading ? (
              <p className="px-3 py-8 text-center text-xs text-muted">
                Loading notifications…
              </p>
            ) : null}

            {notificationsQuery.isError ? (
              <div className="space-y-2 px-3 py-8 text-center">
                <p className="text-xs font-medium text-danger">
                  Failed to load notifications.
                </p>
                <button
                  type="button"
                  onClick={() => void notificationsQuery.refetch()}
                  className="inline-flex h-7 items-center rounded-md bg-primary-light px-2.5 text-[11px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {!notificationsQuery.isLoading &&
            !notificationsQuery.isError &&
            (notificationsQuery.data?.items.length ?? 0) === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-muted">
                No notifications yet.
              </p>
            ) : null}

            {!notificationsQuery.isLoading &&
            !notificationsQuery.isError &&
            (notificationsQuery.data?.items.length ?? 0) > 0 ? (
              <ul className="divide-y divide-border-subtle">
                {notificationsQuery.data!.items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onSelect={handleSelect}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
