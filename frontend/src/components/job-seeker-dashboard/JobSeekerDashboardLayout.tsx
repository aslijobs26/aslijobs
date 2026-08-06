"use client";

import { JobSeekerAuthGuard } from "@/components/job-seeker/JobSeekerAuthGuard";
import { JobSeekerSidebar } from "@/components/job-seeker-dashboard/JobSeekerSidebar";
import { JobSeekerTopBar } from "@/components/job-seeker-dashboard/JobSeekerTopBar";
import { FloatingBottomNav } from "@/components/layout/FloatingBottomNav";
import {
  JOB_SEEKER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
  JOB_SEEKER_DASHBOARD_SIDEBAR_WIDTH,
} from "@/constants/job-seeker-dashboard";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type JobSeekerDashboardLayoutProps = {
  children: ReactNode;
};

export function JobSeekerDashboardLayout({
  children,
}: JobSeekerDashboardLayoutProps) {
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
    <JobSeekerAuthGuard>
      <div
        className="min-h-dvh bg-hero-bg"
        style={
          {
            "--seeker-sidebar-width": JOB_SEEKER_DASHBOARD_SIDEBAR_WIDTH,
            "--seeker-sidebar-collapsed-width":
              JOB_SEEKER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
          } as CSSProperties
        }
      >
        <JobSeekerSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCollapseToggle={() => setCollapsed((current) => !current)}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div
          className="flex min-h-dvh flex-col transition-[padding] duration-200 ease-out lg:pl-[var(--seeker-sidebar-current-width)]"
          style={
            {
              "--seeker-sidebar-current-width": collapsed
                ? "var(--seeker-sidebar-collapsed-width)"
                : "var(--seeker-sidebar-width)",
            } as CSSProperties
          }
        >
          <JobSeekerTopBar onSidebarToggle={handleSidebarToggle} />
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
        <FloatingBottomNav />
      </div>
    </JobSeekerAuthGuard>
  );
}
