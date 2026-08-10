"use client";

import { SettingsSection } from "@/components/job-seeker-settings/SettingsSection";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import type { JobSeekerPublic } from "@/types/job-seeker";
import { formatWhatsappNumber } from "@/utils/job-seeker-profile";
import { CheckCircle2, MessageCircle } from "lucide-react";

type ConnectedAppsPanelProps = {
  jobSeeker: JobSeekerPublic;
};

export function ConnectedAppsPanel({ jobSeeker }: ConnectedAppsPanelProps) {
  const phone = formatWhatsappNumber(jobSeeker.whatsappNumber) || "—";
  const connected = jobSeeker.isWhatsappVerified;

  return (
    <SettingsSection
      title="Connected Apps"
      description="Services linked to your job seeker account. Only supported integrations are shown."
    >
      <ul className="space-y-3">
        <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle px-4 py-3.5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-resource-guide-icon-surface text-resource-guide-icon">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground sm:text-sm">
                WhatsApp
              </p>
              <p className="mt-0.5 text-[11px] text-muted sm:text-xs">
                Used for OTP sign-in and important updates.
              </p>
              <p className="mt-1 truncate text-xs text-muted sm:text-sm">
                {phone}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={
                connected
                  ? "inline-flex items-center gap-1 rounded-md bg-resource-guide-icon-surface px-2 py-0.5 text-[11px] font-semibold text-resource-guide-icon"
                  : "inline-flex rounded-md bg-hero-bg px-2 py-0.5 text-[11px] font-semibold text-muted"
              }
            >
              {connected ? (
                <>
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Connected
                </>
              ) : (
                "Not Connected"
              )}
            </span>
            {!connected ? (
              <a
                href={WHATSAPP_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center rounded-lg border border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
              >
                Get help
              </a>
            ) : null}
          </div>
        </li>
      </ul>
      <p className="mt-3 text-[11px] text-muted sm:text-xs">
        Google and other social logins are not available for job seekers yet.
      </p>
    </SettingsSection>
  );
}
