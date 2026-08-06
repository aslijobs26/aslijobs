"use client";

import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { ROUTES } from "@/constants/routes";
import { CreditCard } from "lucide-react";
import Link from "next/link";

export function BillingPanel() {
  return (
    <SettingsSection
      title="Billing & Invoices"
      description="Subscription, credits, and invoice APIs are not available in AsliJobs yet."
    >
      <div className="rounded-xl border border-dashed border-border-subtle bg-hero-bg/60 px-4 py-8 text-center">
        <span className="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-primary-light text-primary">
          <CreditCard className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-semibold text-foreground">
          Billing is not enabled for this workspace
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Plan selection, invoices, and payment history will appear here once
          the subscription module ships. No plan or credit balances are stored
          today.
        </p>
        <Link
          href={ROUTES.EMPLOYER_SUBSCRIPTION}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Open Subscription page
        </Link>
      </div>
    </SettingsSection>
  );
}
