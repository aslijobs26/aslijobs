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
import { cn } from "../../../../utils/cn";
import { formatEmployerRegisteredLabel, formatIndustryOrCategory } from "../employers-format";

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
    <section className="@container flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-border-subtle bg-surface p-3 shadow-sm ops-brand-border-glow max-sm:rounded-lg sm:p-3.5">
      <header className="flex min-w-0 shrink-0 items-center gap-2 border-b border-border-subtle pb-2">
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <h3 className="min-w-0 text-xs font-semibold leading-tight tracking-wide text-foreground sm:text-[13px]">
          {title}
        </h3>
      </header>
      <div className="mt-2.5 min-w-0 flex-1">{children}</div>
    </section>
  );
}

/**
 * Field grid keyed to the card's own width (container queries), not only
 * the viewport. Narrow cards stay single-column; wider cards use two columns.
 */
function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-x-5 gap-y-3 @[18rem]:grid-cols-2 @[18rem]:gap-x-6 @[18rem]:gap-y-3.5">
      {children}
    </dl>
  );
}

function InfoRow({
  label,
  value,
  isMono = false,
  isLink = false,
  href,
  fullWidth = false,
}: {
  label: string;
  value?: string | number | null;
  isMono?: boolean;
  isLink?: boolean;
  href?: string;
  /** Span both columns (addresses, remarks, long links). */
  fullWidth?: boolean;
}) {
  const display = value != null && value !== "" ? String(value) : "—";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        fullWidth && "col-span-full",
      )}
    >
      <dt className="text-[11px] font-medium leading-none text-muted">
        {label}
      </dt>
      <dd className="min-w-0">
        {isLink && href && display !== "—" ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-start gap-1 text-xs font-semibold leading-snug text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span className="min-w-0 break-all [overflow-wrap:anywhere]">
              {display}
            </span>
            <ExternalLink
              className="mt-0.5 size-3 shrink-0"
              aria-hidden="true"
            />
          </a>
        ) : (
          <span
            className={cn(
              "block text-xs font-semibold leading-snug text-foreground [overflow-wrap:anywhere] break-words",
              isMono && "font-mono text-[11px] tracking-tight",
            )}
          >
            {display}
          </span>
        )}
      </dd>
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
    <div className="space-y-3 max-sm:space-y-2.5 sm:space-y-4">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6">
        <article className="min-w-0 rounded-lg border border-border-subtle bg-surface p-2 shadow-xs sm:rounded-xl sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5 text-muted">
            <Briefcase className="size-3.5 shrink-0 text-primary" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
              Total Jobs
            </span>
          </div>
          <p className="mt-1.5 text-base font-bold tabular-nums text-foreground sm:text-xl">
            {stats.totalJobs}
          </p>
        </article>

        <article className="min-w-0 rounded-lg border border-border-subtle bg-surface p-2 shadow-xs sm:rounded-xl sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5 text-muted">
            <CheckCircle2 className="size-3.5 shrink-0 text-success" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
              Active Jobs
            </span>
          </div>
          <p className="mt-1.5 text-base font-bold tabular-nums text-success sm:text-xl">
            {stats.activeJobs}
          </p>
        </article>

        <article className="min-w-0 rounded-lg border border-border-subtle bg-surface p-2 shadow-xs sm:rounded-xl sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5 text-muted">
            <Clock className="size-3.5 shrink-0 text-warning" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
              Pending Jobs
            </span>
          </div>
          <p className="mt-1.5 text-base font-bold tabular-nums text-warning sm:text-xl">
            {stats.pendingJobs}
          </p>
        </article>

        <article className="min-w-0 rounded-lg border border-border-subtle bg-surface p-2 shadow-xs sm:rounded-xl sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5 text-muted">
            <Users className="size-3.5 shrink-0 text-chart-accent" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
              Applications
            </span>
          </div>
          <p className="mt-1.5 text-base font-bold tabular-nums text-chart-accent sm:text-xl">
            {stats.totalApplications}
          </p>
        </article>

        <article className="min-w-0 rounded-lg border border-border-subtle bg-surface p-2 shadow-xs sm:rounded-xl sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5 text-muted">
            <FileCheck className="size-3.5 shrink-0 text-chart-accent-alt" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
              Shortlisted
            </span>
          </div>
          <p className="mt-1.5 text-base font-bold tabular-nums text-chart-accent-alt sm:text-xl">
            {stats.shortlistedApplications}
          </p>
        </article>

        <article className="min-w-0 rounded-lg border border-border-subtle bg-surface p-2 shadow-xs sm:rounded-xl sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5 text-muted">
            <Award className="size-3.5 shrink-0 text-success" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
              Hired
            </span>
          </div>
          <p className="mt-1.5 text-base font-bold tabular-nums text-success sm:text-xl">
            {stats.hiredApplications}
          </p>
        </article>
      </div>

      {/* Account Type Specific Details & Contacts */}
      {isIndividual ? (
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 lg:gap-3.5">
          <SectionCard title="Individual & Account Details" icon={UserCheck}>
            <InfoGrid>
              <InfoRow
                label="Individual Name"
                value={employer.contactPersonName || employer.displayName}
              />
              {hasText(employer.establishmentName) &&
              employer.establishmentName.trim().toLowerCase() !==
                "individual" ? (
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
                <InfoRow
                  label="Address"
                  value={employer.companyAddress}
                  fullWidth
                />
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
                value={formatEmployerRegisteredLabel(employer)}
              />
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Contact & Verification Status" icon={ShieldCheck}>
            <InfoGrid>
              <InfoRow label="WhatsApp Phone" value={employer.phone} />
              {hasText(employer.email) ? (
                <InfoRow
                  label="Email Address"
                  value={employer.email}
                  fullWidth
                />
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
              <InfoRow
                label="Verified Date"
                value={
                  hasText(employer.verifiedAtDate)
                    ? employer.verifiedAtDate
                    : "—"
                }
              />
              <InfoRow label="Account Status" value={employer.statusLabel} />
              {hasText(employer.verificationRemarks) ? (
                <InfoRow
                  label="Verification Remarks"
                  value={employer.verificationRemarks}
                  fullWidth
                />
              ) : null}
              {hasText(employer.suspensionReason) ? (
                <InfoRow
                  label="Suspension Reason"
                  value={employer.suspensionReason}
                  fullWidth
                />
              ) : null}
            </InfoGrid>
          </SectionCard>
        </div>
      ) : isConsultancy ? (
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 lg:gap-3.5">
          <SectionCard title="Consultancy Details" icon={Building}>
            <InfoGrid>
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
                <InfoRow
                  label="Address"
                  value={employer.companyAddress}
                  fullWidth
                />
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
                  fullWidth
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
                value={formatEmployerRegisteredLabel(employer)}
              />
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Contact & Verification Status" icon={User}>
            <InfoGrid>
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
                <InfoRow
                  label="Email Address"
                  value={employer.email}
                  fullWidth
                />
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
              <InfoRow
                label="Verified Date"
                value={
                  hasText(employer.verifiedAtDate)
                    ? employer.verifiedAtDate
                    : "—"
                }
              />
              <InfoRow label="Account Status" value={employer.statusLabel} />
              {hasText(employer.verificationRemarks) ? (
                <InfoRow
                  label="Verification Remarks"
                  value={employer.verificationRemarks}
                  fullWidth
                />
              ) : null}
              {hasText(employer.suspensionReason) ? (
                <InfoRow
                  label="Suspension Reason"
                  value={employer.suspensionReason}
                  fullWidth
                />
              ) : null}
            </InfoGrid>
          </SectionCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 lg:gap-3.5">
          <SectionCard title="Company & Organization Details" icon={Building}>
            <InfoGrid>
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
                <InfoRow
                  label="Address"
                  value={employer.companyAddress}
                  fullWidth
                />
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
                  fullWidth
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
                value={formatEmployerRegisteredLabel(employer)}
                fullWidth
              />
            </InfoGrid>
          </SectionCard>

          <SectionCard title="Contact & Verification Status" icon={User}>
            <InfoGrid>
              {hasText(employer.contactPersonName) ? (
                <InfoRow
                  label="Contact Person"
                  value={employer.contactPersonName}
                />
              ) : null}
              <InfoRow
                label="Designation"
                value={
                  hasText(employer.contactDesignation)
                    ? employer.contactDesignation
                    : "—"
                }
              />
              <InfoRow label="WhatsApp Phone" value={employer.phone} />
              {hasText(employer.alternatePhone) ? (
                <InfoRow
                  label="Alternate Phone"
                  value={employer.alternatePhone}
                />
              ) : null}
              {hasText(employer.email) ? (
                <InfoRow
                  label="Email Address"
                  value={employer.email}
                  fullWidth
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
              <InfoRow
                label="Verified Date"
                value={
                  hasText(employer.verifiedAtDate)
                    ? employer.verifiedAtDate
                    : "—"
                }
              />
              <InfoRow label="Account Status" value={employer.statusLabel} />
              {hasText(employer.verificationRemarks) ? (
                <InfoRow
                  label="Verification Remarks"
                  value={employer.verificationRemarks}
                  fullWidth
                />
              ) : null}
              {hasText(employer.suspensionReason) ? (
                <InfoRow
                  label="Suspension Reason"
                  value={employer.suspensionReason}
                  fullWidth
                />
              ) : null}
            </InfoGrid>
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
          <div className="space-y-3 text-xs">
            {hasText(employer.companyDescription) ? (
              <div className="min-w-0">
                <h4 className="text-[11px] font-semibold text-foreground">
                  {isIndividual ? "Profile Description" : "Company Description"}
                </h4>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap break-words text-muted [overflow-wrap:anywhere]">
                  {employer.companyDescription}
                </p>
              </div>
            ) : null}

            {hasText(employer.aboutUs) ? (
              <div className="min-w-0">
                <h4 className="text-[11px] font-semibold text-foreground">
                  About Us
                </h4>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap break-words text-muted [overflow-wrap:anywhere]">
                  {employer.aboutUs}
                </p>
              </div>
            ) : null}

            {!isIndividual && hasText(employer.culture) ? (
              <div className="min-w-0">
                <h4 className="text-[11px] font-semibold text-foreground">
                  Work Culture
                </h4>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap break-words text-muted [overflow-wrap:anywhere]">
                  {employer.culture}
                </p>
              </div>
            ) : null}

            {!isIndividual && hasText(employer.benefits) ? (
              <div className="min-w-0">
                <h4 className="text-[11px] font-semibold text-foreground">
                  Perks & Benefits
                </h4>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap break-words text-muted [overflow-wrap:anywhere]">
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
