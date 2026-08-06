"use client";

import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { ROUTES } from "@/constants/routes";
import { FileText, Shield } from "lucide-react";
import Link from "next/link";

export function DataPrivacyPanel() {
  return (
    <SettingsSection
      title="Data & Privacy"
      description="Legal documents for AsliJobs. Account export and deletion APIs are not available yet."
    >
      <ul className="space-y-3" role="list">
        <li>
          <Link
            href={ROUTES.PRIVACY_POLICY}
            className="flex items-start gap-3 rounded-xl border border-border-subtle px-3.5 py-3 transition-colors hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Shield className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                Privacy Policy
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                How AsliJobs collects and uses employer data.
              </span>
            </span>
          </Link>
        </li>
        <li>
          <Link
            href={ROUTES.TERMS_AND_CONDITIONS}
            className="flex items-start gap-3 rounded-xl border border-border-subtle px-3.5 py-3 transition-colors hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                Terms & Conditions
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                Terms of use for the AsliJobs platform.
              </span>
            </span>
          </Link>
        </li>
      </ul>
      <p className="mt-4 text-xs text-muted">
        Download my data, delete account, and GDPR export tools will appear here
        when those APIs are implemented.
      </p>
    </SettingsSection>
  );
}
