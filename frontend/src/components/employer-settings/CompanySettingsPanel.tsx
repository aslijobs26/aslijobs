"use client";

import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import type { EmployerLoginPublic } from "@/services/employer-login.service";
import { ROUTES } from "@/constants/routes";
import { ArrowRight, Building2, Globe2, MapPin } from "lucide-react";
import Link from "next/link";

type CompanySettingsPanelProps = {
  employer: EmployerLoginPublic;
  canUpdate: boolean;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
        {value.trim() || "—"}
      </p>
    </div>
  );
}

export function CompanySettingsPanel({
  employer,
  canUpdate,
}: CompanySettingsPanelProps) {
  const isIndividual = employer.accountType === "individual";
  const companyName = isIndividual
    ? employer.establishmentName
    : employer.companyName;
  const size =
    employer.minimumEmployees != null || employer.maximumEmployees != null
      ? `${employer.minimumEmployees ?? "—"}–${employer.maximumEmployees ?? "—"}`
      : "";
  const location = [employer.city, employer.state, employer.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Company Settings"
        description="Company profile data is managed in the Company Profile workspace."
        action={
          <Link
            href={ROUTES.EMPLOYER_COMPANY_PROFILE}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {canUpdate ? "Manage profile" : "View profile"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      >
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-border-subtle bg-surface p-3.5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              {companyName.trim() || "Organization"}
            </p>
            <p className="mt-0.5 text-xs text-muted capitalize">
              {employer.accountType} account
              {employer.registrationStatus
                ? ` · ${employer.registrationStatus}`
                : ""}
            </p>
            {employer.website ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <Globe2 className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{employer.website}</span>
              </p>
            ) : null}
            {location ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{location}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Industry" value={employer.industry} />
          <Field label="Business category" value={employer.businessCategory} />
          <Field label="Company type" value={employer.companyType} />
          <Field label="Company size" value={size} />
          <Field label="GST" value={employer.gstNumber} />
          <Field label="PAN" value={employer.panNumber} />
          <Field label="Registration number" value={employer.registrationNumber} />
          <Field
            label="Founded year"
            value={
              employer.foundedYear != null ? String(employer.foundedYear) : ""
            }
          />
          <Field label="Address" value={employer.companyAddress} />
          <Field label="Contact email" value={employer.emailAddress} />
          <Field label="Contact designation" value={employer.contactDesignation} />
          <Field label="Alternate phone" value={employer.alternatePhone} />
        </div>
      </SettingsSection>
    </div>
  );
}
