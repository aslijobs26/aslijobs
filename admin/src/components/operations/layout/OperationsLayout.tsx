import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  OPERATIONS_SIDEBAR_COLLAPSED_WIDTH,
  OPERATIONS_SIDEBAR_WIDTH,
} from "../../../constants/operations-layout";
import { OperationsHeader } from "./OperationsHeader";
import { OperationsSidebar } from "./OperationsSidebar";

interface OperationsLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function OperationsLayout({
  title,
  subtitle,
  children,
}: OperationsLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      className="h-dvh overflow-hidden bg-hero-bg"
      style={
        {
          "--operations-sidebar-width": OPERATIONS_SIDEBAR_WIDTH,
          "--operations-sidebar-collapsed-width":
            OPERATIONS_SIDEBAR_COLLAPSED_WIDTH,
          "--operations-sidebar-current-width": sidebarCollapsed
            ? OPERATIONS_SIDEBAR_COLLAPSED_WIDTH
            : OPERATIONS_SIDEBAR_WIDTH,
        } as CSSProperties
      }
    >
      <OperationsSidebar
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed((current) => !current)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex h-dvh flex-col transition-[padding] duration-200 ease-out lg:pl-[var(--operations-sidebar-current-width)]">
        <OperationsHeader
          title={title}
          subtitle={subtitle}
          onSidebarToggle={handleSidebarToggle}
        />
        <main className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
