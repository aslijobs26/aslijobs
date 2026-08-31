import {
  Award,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  Globe,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import type { OperationsEmployerDetail } from "../../../../types/operations-employers";
import { formatIndustryOrCategory } from "../employers-format";

interface EmployerOverviewPanelProps {
  employer: OperationsEmployerDetail;
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Briefcase;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm ops-brand-border-glow sm:p-5">
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          {title}
        </h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  isMono = false,
  isLink = false,
  href,
}: {
  label: string;
  value?: string | number | null;
  isMono?: boolean;
  isLink?: boolean;
  href?: string;
}) {
  const display = value != null && value !== "" ? String(value) : "—";

  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs font-medium text-muted">{label}</span>
      {isLink && href && display !== "—" ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1 break-all text-xs font-semibold text-primary hover:underline"
        >
          <span className="truncate">{display}</span>
          <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
        </a>
      ) : (
        <span
          className={`break-words text-xs font-semibold text-foreground ${isMono ? "font-mono" : ""}`}
        >
          {display}
        </span>
      )}
    </div>
  );
}

function hasText(val: string | null | undefined): boolean {
  if (val == null) return false;
  const trimmed = String(val).trim();
  return (
    trimmed !== "" &&
    trimmed !== "—" &&
    trimmed !== "null" &&
    trimmed !== "undefined"
  );
}

export function EmployerOverviewPanel({ employer }: EmployerOverviewPanelProps) {
  const stats = employer.analytics;

  const normalizedType = employer.accountType?.toLowerCase().trim() || "";
  const isIndividual =
    normalizedType === "individual" ||
    employer.organizationType?.toLowerCase() === "individual";
  const isConsultancy = normalizedType === "consultancy";

  const formattedIndustry = formatIndustryOrCategory(employer.industry);
  const formattedBusinessCategory = formatIndustryOrCategory(
    employer.businessCategory,
  );

  const companySizeDisplay =
    employer.minimumEmployees && employer.maximumEmployees
      ? `${employer.minimumEmployees} - ${employer.maximumEmployees} employees`
      : employer.minimumEmployees
        ? `From ${employer.minimumEmployees} employees`
        : null;

  return (
    <div className="space-y-4">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <article className="rounded-xl border border-border-subtle bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <Briefcase className="size-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase">Total Jobs</span>
          </div>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
            {stats.totalJobs}
          </p>
        </article>

        <article className="rounded-xl border border-border-subtle bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <CheckCircle2 className="size-3.5 text-success" />
            <span className="text-[11px] font-semibold uppercase">Active Jobs</span>
          </div>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-success">
            {stats.activeJobs}
          </p>
        </article>

        <article className="rounded-xl border border-border-subtle bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <Clock className="size-3.5 text-warning" />
            <span className="text-[11px] font-semibold uppercase">Pending Jobs</span>
          </div>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-warning">
            {stats.pendingJobs}
          </p>
        </article>

        <article className="rounded-xl border border-border-subtle bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <Users className="size-3.5 text-chart-accent" />
            <span className="text-[11px] font-semibold uppercase">Applications</span>
          </div>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-chart-accent">
            {stats.totalApplications}
          </p>
        </article>

        <article className="rounded-xl border border-border-subtle bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <FileCheck className="size-3.5 text-chart-accent-alt" />
            <span className="text-[11px] font-semibold uppercase">Shortlisted</span>
          </div>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-chart-accent-alt">
            {stats.shortlistedApplications}
          </p>
        </article>

        <article className="rounded-xl border border-border-subtle bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-2 text-muted">
            <Award className="size-3.5 text-success" />
            <span className="text-[11px] font-semibold uppercase">Hired</span>
          </div>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-success">
            {stats.hiredApplications}
          </p>
        </article>
      </div>

      {/* Account Type Specific Details & Contacts */}
      {isIndividual ? (
        /* 1. INDIVIDUAL EMPLOYER PROFILE */
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Individual & Account Details" icon={UserCheck}>
            <div className="divide-y divide-border-subtle">
              <InfoRow
                label="Individual Name"
                value={employer.contactPersonName || employer.displayName}
              />
              {hasText(employer.establishmentName) &&
              employer.establishmentName.trim().toLowerCase() !== "individual" ? (
                <InfoRow
                  label="Establishment Name"
                  value={employer.establishmentName}
                />
              ) : null}
              <InfoRow label="Account Type" value="Individual" />
              <InfoRow
                label="Organization Type"
                value={employer.organizationType || "Individual"}
              />
              {hasText(employer.location) ? (
                <InfoRow label="Location" value={employer.location} />
              ) : null}
              {hasText(employer.companyAddress) ? (
                <InfoRow label="Address" value={employer.companyAddress} />
              ) : null}
              {hasText(employer.pincode) ? (
                <InfoRow label="Pincode" value={employer.pincode} isMono />
              ) : null}
              <InfoRow
                label="Profile Status"
                value={employer.isProfileComplete ? "Complete" : "Incomplete"}
              />
              <InfoRow
                label="Registered On"
                value={`${employer.registeredAtDate} ${employer.registeredAtTime}`}
              />
            </div>
          </SectionCard>

          <SectionCard title="Contact & Verification Status" icon={ShieldCheck}>
            <div className="divide-y divide-border-subtle">
              <InfoRow label="WhatsApp Phone" value={employer.phone} />
              {hasText(employer.email) ? (
                <InfoRow label="Email Address" value={employer.email} />
              ) : null}
              {hasText(employer.alternatePhone) ? (
                <InfoRow
                  label="Alternate Phone"
                  value={employer.alternatePhone}
                />
              ) : null}
              <InfoRow
                label="WhatsApp Verified"
                value={employer.isWhatsappVerified ? "Yes (Verified)" : "No"}
              />
              <InfoRow
                label="Verification Status"
                value={employer.verificationStatusLabel}
              />
              {hasText(employer.verifiedAtDate) ? (
                <InfoRow label="Verified Date" value={employer.verifiedAtDate} />
              ) : null}
              {hasText(employer.verificationRemarks) ? (
                <InfoRow
                  label="Verification Remarks"
                  value={employer.verificationRemarks}
                />
              ) : null}
              <InfoRow label="Account Status" value={employer.statusLabel} />
              {hasText(employer.suspensionReason) ? (
                <InfoRow
                  label="Suspension Reason"
                  value={employer.suspensionReason}
                />
              ) : null}
            </div>
          </SectionCard>
        </div>
      ) : isConsultancy ? (
        /* 2. CONSULTANCY EMPLOYER PROFILE */
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Consultancy Details" icon={Building}>
            <div className="divide-y divide-border-subtle">
              <InfoRow
                label="Consultancy Name"
                value={employer.companyName || employer.displayName}
              />
              <InfoRow label="Account Type" value="Consultancy" />
              <InfoRow
                label="Organization Type"
                value={employer.organizationType || "Consultancy"}
              />
              {hasText(employer.companyAddress) ? (
                <InfoRow label="Address" value={employer.companyAddress} />
              ) : null}
              {hasText(employer.pincode) ? (
                <InfoRow label="Pincode" value={employer.pincode} isMono />
              ) : null}
              {hasText(employer.location) ? (
                <InfoRow label="City & State" value={employer.location} />
              ) : null}
              {hasText(employer.website) ? (
                <InfoRow
                  label="Website"
                  value={employer.website}
                  isLink
                  href={
                    employer.website.startsWith("http")
                      ? employer.website
                      : `https://${employer.website}`
                  }
                />
              ) : null}
              {hasText(employer.gstNumber) ? (
                <InfoRow label="GST Number" value={employer.gstNumber} isMono />
              ) : null}
              {hasText(employer.panNumber) ? (
                <InfoRow label="PAN Number" value={employer.panNumber} isMono />
              ) : null}
              {hasText(employer.registrationNumber) ? (
                <InfoRow
                  label="Registration Number"
                  value={employer.registrationNumber}
                  isMono
                />
              ) : null}
              <InfoRow
                label="Profile Status"
                value={employer.isProfileComplete ? "Complete" : "Incomplete"}
              />
              <InfoRow
                label="Registered On"
                value={`${employer.registeredAtDate} ${employer.registeredAtTime}`}
              />
            </div>
          </SectionCard>

          <SectionCard title="Contact & Verification Status" icon={User}>
            <div className="divide-y divide-border-subtle">
              {hasText(employer.contactPersonName) ? (
                <InfoRow
                  label="Contact Person"
                  value={employer.contactPersonName}
                />
              ) : null}
              {hasText(employer.contactDesignation) ? (
                <InfoRow
                  label="Designation"
                  value={employer.contactDesignation}
                />
              ) : null}
              <InfoRow label="WhatsApp Phone" value={employer.phone} />
              {hasText(employer.email) ? (
                <InfoRow label="Email Address" value={employer.email} />
              ) : null}
              {hasText(employer.alternatePhone) ? (
                <InfoRow
                  label="Alternate Phone"
                  value={employer.alternatePhone}
                />
              ) : null}
              <InfoRow
                label="WhatsApp Verified"
                value={employer.isWhatsappVerified ? "Yes (Verified)" : "No"}
              />
              <InfoRow
                label="Verification Status"
                value={employer.verificationStatusLabel}
              />
              {hasText(employer.verifiedAtDate) ? (
                <InfoRow label="Verified Date" value={employer.verifiedAtDate} />
              ) : null}
              {hasText(employer.verificationRemarks) ? (
                <InfoRow
                  label="Verification Remarks"
                  value={employer.verificationRemarks}
                />
              ) : null}
              <InfoRow label="Account Status" value={employer.statusLabel} />
              {hasText(employer.suspensionReason) ? (
                <InfoRow
                  label="Suspension Reason"
                  value={employer.suspensionReason}
                />
              ) : null}
            </div>
          </SectionCard>
        </div>
      ) : (
        /* 3. COMPANY / BUSINESS EMPLOYER PROFILE */
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Company & Organization Details" icon={Building}>
            <div className="divide-y divide-border-subtle">
              <InfoRow
                label="Company Name"
                value={employer.companyName || employer.displayName}
              />
              <InfoRow label="Account Type" value="Company" />
              <InfoRow
                label="Organization Type"
                value={employer.organizationType || "Private Company"}
              />
              {hasText(formattedIndustry) ? (
                <InfoRow label="Industry" value={formattedIndustry} />
              ) : null}
              {hasText(formattedBusinessCategory) ? (
                <InfoRow
                  label="Business Category"
                  value={formattedBusinessCategory}
                />
              ) : null}
              {companySizeDisplay ? (
                <InfoRow label="Company Size" value={companySizeDisplay} />
              ) : null}
              {hasText(employer.companyAddress) ? (
                <InfoRow label="Address" value={employer.companyAddress} />
              ) : null}
              {hasText(employer.pincode) ? (
                <InfoRow label="Pincode" value={employer.pincode} isMono />
              ) : null}
              {hasText(employer.location) ? (
                <InfoRow label="City & State" value={employer.location} />
              ) : null}
              {typeof employer.foundedYear === "number" &&
              employer.foundedYear > 0 ? (
                <InfoRow label="Founded Year" value={employer.foundedYear} />
              ) : null}
              {hasText(employer.website) ? (
                <InfoRow
                  label="Website"
                  value={employer.website}
                  isLink
                  href={
                    employer.website.startsWith("http")
                      ? employer.website
                      : `https://${employer.website}`
                  }
                />
              ) : null}
              {hasText(employer.gstNumber) ? (
                <InfoRow label="GST Number" value={employer.gstNumber} isMono />
              ) : null}
              {hasText(employer.panNumber) ? (
                <InfoRow label="PAN Number" value={employer.panNumber} isMono />
              ) : null}
              {hasText(employer.registrationNumber) ? (
                <InfoRow
                  label="Registration Number"
                  value={employer.registrationNumber}
                  isMono
                />
              ) : null}
              <InfoRow
                label="Profile Status"
                value={employer.isProfileComplete ? "Complete" : "Incomplete"}
              />
              <InfoRow
                label="Registered On"
                value={`${employer.registeredAtDate} ${employer.registeredAtTime}`}
              />
            </div>
          </SectionCard>

          <SectionCard title="Contact & Verification Status" icon={User}>
            <div className="divide-y divide-border-subtle">
              {hasText(employer.contactPersonName) ? (
                <InfoRow
                  label="Contact Person"
                  value={employer.contactPersonName}
                />
              ) : null}
              {hasText(employer.contactDesignation) ? (
                <InfoRow
                  label="Designation"
                  value={employer.contactDesignation}
                />
              ) : null}
              <InfoRow label="WhatsApp Phone" value={employer.phone} />
              {hasText(employer.email) ? (
                <InfoRow label="Email Address" value={employer.email} />
              ) : null}
              {hasText(employer.alternatePhone) ? (
                <InfoRow
                  label="Alternate Phone"
                  value={employer.alternatePhone}
                />
              ) : null}
              <InfoRow
                label="WhatsApp Verified"
                value={employer.isWhatsappVerified ? "Yes (Verified)" : "No"}
              />
              <InfoRow
                label="Verification Status"
                value={employer.verificationStatusLabel}
              />
              {hasText(employer.verifiedAtDate) ? (
                <InfoRow label="Verified Date" value={employer.verifiedAtDate} />
              ) : null}
              {hasText(employer.verificationRemarks) ? (
                <InfoRow
                  label="Verification Remarks"
                  value={employer.verificationRemarks}
                />
              ) : null}
              <InfoRow label="Account Status" value={employer.statusLabel} />
              {hasText(employer.suspensionReason) ? (
                <InfoRow
                  label="Suspension Reason"
                  value={employer.suspensionReason}
                />
              ) : null}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Description & Culture Section - Rendered only when content exists */}
      {hasText(employer.companyDescription) ||
      hasText(employer.aboutUs) ||
      (!isIndividual && hasText(employer.culture)) ||
      (!isIndividual && hasText(employer.benefits)) ? (
        <SectionCard
          title={
            isIndividual
              ? "About & Profile Description"
              : isConsultancy
                ? "About Consultancy"
                : "About Company & Culture"
          }
          icon={Globe}
        >
          <div className="space-y-4 text-xs">
            {hasText(employer.companyDescription) ? (
              <div>
                <h4 className="font-semibold text-foreground">
                  {isIndividual ? "Profile Description" : "Company Description"}
                </h4>
                <p className="mt-1 leading-relaxed text-muted whitespace-pre-wrap">
                  {employer.companyDescription}
                </p>
              </div>
            ) : null}

            {hasText(employer.aboutUs) ? (
              <div>
                <h4 className="font-semibold text-foreground">About Us</h4>
                <p className="mt-1 leading-relaxed text-muted whitespace-pre-wrap">
                  {employer.aboutUs}
                </p>
              </div>
            ) : null}

            {!isIndividual && hasText(employer.culture) ? (
              <div>
                <h4 className="font-semibold text-foreground">Work Culture</h4>
                <p className="mt-1 leading-relaxed text-muted whitespace-pre-wrap">
                  {employer.culture}
                </p>
              </div>
            ) : null}

            {!isIndividual && hasText(employer.benefits) ? (
              <div>
                <h4 className="font-semibold text-foreground">Perks & Benefits</h4>
                <p className="mt-1 leading-relaxed text-muted whitespace-pre-wrap">
                  {employer.benefits}
                </p>
              </div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

