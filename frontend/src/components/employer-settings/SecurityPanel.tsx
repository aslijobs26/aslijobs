"use client";

import { SecurityCard } from "@/components/employer-settings/SecurityCard";
import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { ROUTES } from "@/constants/routes";
import { clearEmployerClientSession } from "@/utils/employer-session";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type SecurityPanelProps = {
  principalType: "owner" | "member" | undefined;
  roleLabel: string;
};

export function SecurityPanel({
  principalType,
  roleLabel,
}: SecurityPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = useCallback(() => {
    void (async () => {
      await clearEmployerClientSession(queryClient);
      router.replace(ROUTES.HOME);
    })();
  }, [queryClient, router]);

  const isMember = principalType === "member";

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Authentication"
        description="How you sign in to this workspace."
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border-subtle px-3 py-2.5">
            <dt className="text-xs font-medium text-muted">Sign-in method</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {isMember ? "Email & password (team member)" : "WhatsApp OTP"}
            </dd>
          </div>
          <div className="rounded-lg border border-border-subtle px-3 py-2.5">
            <dt className="text-xs font-medium text-muted">Workspace role</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {roleLabel}
            </dd>
          </div>
        </dl>
      </SettingsSection>

      <SecurityCard
        actions={[
          {
            id: "logout",
            title: "Sign out",
            description: "End this device session and clear local tokens.",
            actionLabel: "Log out",
            onAction: handleLogout,
            icon: "logout",
          },
          {
            id: "password",
            title: "Password",
            description: isMember
              ? "Password changes are not available in Settings yet."
              : "Employer owners sign in with WhatsApp OTP, not a password.",
            actionLabel: "Unavailable",
            disabled: true,
            icon: "password",
          },
          {
            id: "twoFactor",
            title: "Two-Factor Authentication",
            description: "2FA is not available in the AsliJobs API yet.",
            actionLabel: "Unavailable",
            disabled: true,
            icon: "twoFactor",
          },
          {
            id: "sessions",
            title: "Active Sessions",
            description:
              "Device session inventory is not available. Use Log out on this device.",
            actionLabel: "Unavailable",
            disabled: true,
            icon: "sessions",
          },
        ]}
      />
    </div>
  );
}
