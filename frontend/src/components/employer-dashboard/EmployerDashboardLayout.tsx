"use client";

import { EmployerAuthGuard } from "@/components/employer-dashboard/EmployerAuthGuard";
import { EmployerDashboardPlaceholder } from "@/components/employer-dashboard/EmployerDashboardPlaceholder";
import { EmployerNavbar } from "@/components/employer-dashboard/EmployerNavbar";
import { EmployerSearchBar } from "@/components/employer-dashboard/EmployerSearchBar";
import { EmployerSidebar } from "@/components/employer-dashboard/EmployerSidebar";
import {
  EMPLOYER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
  EMPLOYER_DASHBOARD_SIDEBAR_WIDTH,
} from "@/constants/employer-dashboard";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type EmployerDashboardLayoutProps = {
  children?: ReactNode;
};

export function EmployerDashboardLayout({
  children,
}: EmployerDashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const handleSidebarToggle = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((current) => !current);
      return;
    }

    setMobileOpen((current) => !current);
  };

  return (
    <EmployerAuthGuard>
      <div
        className="min-h-dvh bg-hero-bg"
        style={
          {
            "--employer-sidebar-width": EMPLOYER_DASHBOARD_SIDEBAR_WIDTH,
            "--employer-sidebar-collapsed-width":
              EMPLOYER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
          } as CSSProperties
        }
      >
        <EmployerSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCollapseToggle={() => setCollapsed((current) => !current)}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div
          className="flex min-h-dvh flex-col transition-[padding] duration-200 ease-out lg:pl-[var(--employer-sidebar-current-width)]"
          style={
            {
              "--employer-sidebar-current-width": collapsed
                ? "var(--employer-sidebar-collapsed-width)"
                : "var(--employer-sidebar-width)",
            } as CSSProperties
          }
        >
          <EmployerNavbar onSidebarToggle={handleSidebarToggle} />

          <div className="border-b border-border-subtle bg-surface px-3 py-3 md:hidden">
            <EmployerSearchBar />
          </div>

          <main className="flex flex-1 flex-col">
            {children ?? <EmployerDashboardPlaceholder title="Dashboard" />}
          </main>
        </div>
      </div>
    </EmployerAuthGuard>
  );
}
