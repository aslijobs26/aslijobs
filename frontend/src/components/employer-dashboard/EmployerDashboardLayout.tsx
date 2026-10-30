"use client";

import { EmployerAuthGuard } from "@/components/employer-dashboard/EmployerAuthGuard";
import { EmployerDashboardPlaceholder } from "@/components/employer-dashboard/EmployerDashboardPlaceholder";
import { EmployerNavbar } from "@/components/employer-dashboard/EmployerNavbar";
import { EmployerSidebar } from "@/components/employer-dashboard/EmployerSidebar";
import "@/components/employer-dashboard/employer-workspace-layout.css";
import { FloatingBottomNav } from "@/components/layout/FloatingBottomNav";
import { EmployerPermissionRouteGuard } from "@/components/rbac/EmployerPermissionRouteGuard";
import { EmployerPermissionProvider } from "@/providers/employer-permission-provider";
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
      <EmployerPermissionProvider>
        <div className="min-h-dvh bg-hero-bg" data-employer-workspace="">
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

            <main className="flex flex-1 flex-col">
              <EmployerPermissionRouteGuard>
                {children ?? (
                  <EmployerDashboardPlaceholder titleKey="employer.nav.dashboard" />
                )}
              </EmployerPermissionRouteGuard>
            </main>
          </div>
          <FloatingBottomNav />
        </div>
      </EmployerPermissionProvider>
    </EmployerAuthGuard>
  );
}
