import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  OPERATIONS_SIDEBAR_COLLAPSED_WIDTH,
  OPERATIONS_SIDEBAR_COLLAPSED_WIDTH_COMPACT,
  OPERATIONS_SIDEBAR_WIDTH,
  OPERATIONS_SIDEBAR_WIDTH_COMPACT,
  type OperationsLayoutDensity,
} from "../../../constants/operations-layout";
import { cn } from "../../../utils/cn";
import "../dashboard/operations-dashboard-density.css";
import { OperationsHeader } from "./OperationsHeader";
import { OperationsSidebar } from "./OperationsSidebar";

interface OperationsLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  density?: OperationsLayoutDensity;
}

export function OperationsLayout({
  title,
  subtitle,
  children,
  density = "compact",
}: OperationsLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isCompact = density === "compact";
  const sidebarWidth = isCompact
    ? OPERATIONS_SIDEBAR_WIDTH_COMPACT
    : OPERATIONS_SIDEBAR_WIDTH;
  const sidebarCollapsedWidth = isCompact
    ? OPERATIONS_SIDEBAR_COLLAPSED_WIDTH_COMPACT
    : OPERATIONS_SIDEBAR_COLLAPSED_WIDTH;

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  const handleSidebarToggle = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed((current) => !current);
      return;
    }

    setMobileNavOpen((current) => !current);
  };

  return (
    <div
      className={cn(
        "h-dvh overflow-hidden bg-hero-bg",
        isCompact && "operations-dashboard-density",
      )}
      style={
        {
          "--operations-sidebar-width": sidebarWidth,
          "--operations-sidebar-collapsed-width": sidebarCollapsedWidth,
          "--operations-sidebar-current-width": sidebarCollapsed
            ? sidebarCollapsedWidth
            : sidebarWidth,
        } as CSSProperties
      }
    >
      <OperationsSidebar
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed((current) => !current)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        density={density}
      />

      <div className="flex h-dvh min-w-0 flex-col transition-[padding] duration-200 ease-out lg:pl-[var(--operations-sidebar-current-width)]">
        <OperationsHeader
          title={title}
          subtitle={subtitle}
          onSidebarToggle={handleSidebarToggle}
          density={density}
        />
        <main
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto",
            isCompact
              ? "px-2 py-2 sm:px-3 sm:py-2.5 lg:px-3.5 lg:py-2.5"
              : "px-2.5 py-2.5 sm:px-4 sm:py-4 lg:px-5 lg:py-4",
          )}
        >
          <div className="mx-auto w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
