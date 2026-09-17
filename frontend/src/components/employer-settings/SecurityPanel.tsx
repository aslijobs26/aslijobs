"use client";

import { LogoutConfirmDialog } from "@/components/auth/LogoutConfirmDialog";
import { SecurityCard } from "@/components/employer-settings/SecurityCard";
import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { ROUTES } from "@/constants/routes";
import { clearEmployerClientSession } from "@/utils/employer-session";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutRequest = useCallback(() => {
    setIsLogoutConfirmOpen(true);
  }, []);

  const handleLogoutConfirm = useCallback(() => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    void (async () => {
      try {
        await clearEmployerClientSession(queryClient);
        setIsLogoutConfirmOpen(false);
        router.replace(ROUTES.HOME);
      } finally {
        setIsLoggingOut(false);
      }
    })();
  }, [isLoggingOut, queryClient, router]);

  const isMember = principalType === "member";

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Authentication"
        description="How you sign in to this workspace."
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border-subtle px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted sm:text-xs">
              Sign-in method
            </dt>
            <dd className="mt-0.5 text-xs font-semibold text-foreground sm:text-sm">
              {isMember ? "Email & password (team member)" : "WhatsApp OTP"}
            </dd>
          </div>
          <div className="rounded-lg border border-border-subtle px-3 py-2.5">
            <dt className="text-[11px] font-medium text-muted sm:text-xs">
              Workspace role
            </dt>
            <dd className="mt-0.5 text-xs font-semibold text-foreground sm:text-sm">
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
            onAction: handleLogoutRequest,
            icon: "logout",
            tone: "danger",
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

      <LogoutConfirmDialog
        open={isLogoutConfirmOpen}
        isSubmitting={isLoggingOut}
        onClose={() => {
          if (!isLoggingOut) {
            setIsLogoutConfirmOpen(false);
          }
        }}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
