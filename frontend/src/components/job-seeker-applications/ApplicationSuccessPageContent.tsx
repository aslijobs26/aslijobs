"use client";

import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { JobPostedSuccessIcon } from "@/components/job-posted-success/JobPostedSuccessIcon";
import { JobSeekerAuthGuard } from "@/components/job-seeker/JobSeekerAuthGuard";
import { ROUTES } from "@/constants/routes";
import { PROFILE_IMAGE_FIT_CLASSNAME } from "@/constants/profile-image";
import { useTranslate } from "@/i18n/translate";
import { fetchSeekerApplication } from "@/services/job-seeker-applications.service";
import { getApplicationSuccessWhatsAppContext } from "@/utils/application-success";
import { cn } from "@/utils/cn";
import { formatJobSearchJobType } from "@/utils/job-search-format";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { buildJobApplyWhatsAppUrl } from "@/utils/job-search-whatsapp";
import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, type ReactNode } from "react";
import { APPLICATION_STATUS_LABEL_KEYS } from "./applied-jobs-utils";

function formatAppliedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ApplicationSuccessBody() {
  const t = useTranslate();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId")?.trim() ?? "";
  const jobIdParam = searchParams.get("jobId")?.trim() ?? "";

  const detailQuery = useQuery({
    queryKey: ["job-seeker", "application-success", applicationId],
    queryFn: () => fetchSeekerApplication(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 60_000,
  });

  const whatsappContext = useMemo(() => {
    if (!applicationId) {
      return null;
    }
    return getApplicationSuccessWhatsAppContext(applicationId);
  }, [applicationId]);

  const application = detailQuery.data;

  const whatsappUrl = useMemo(() => {
    if (!application && !whatsappContext) {
      return null;
    }

    return buildJobApplyWhatsAppUrl({
      applyWhatsAppNumber:
        whatsappContext?.applyWhatsAppNumber ?? null,
      jobTitle:
        whatsappContext?.jobTitle || application?.jobTitle || "this role",
      companyName:
        whatsappContext?.companyName ||
        application?.companyName ||
        "the employer",
      jobId:
        whatsappContext?.jobId ||
        application?.publicJobId ||
        jobIdParam,
    });
  }, [application, whatsappContext, jobIdParam]);

  if (!applicationId) {
    return (
      <CenteredMessage
        title={t("seeker.applicationSuccess.notFoundTitle")}
        message={t("seeker.applicationSuccess.notFoundBody")}
        actionHref={ROUTES.JOB_SEEKER_APPLIED_JOBS}
        actionLabel={t("seeker.applicationSuccess.viewAppliedJobs")}
      />
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-6">
        <p className="text-sm text-muted">
          {t("seeker.applicationSuccess.loading")}
        </p>
      </div>
    );
  }

  if (detailQuery.isError || !application) {
    return (
      <CenteredMessage
        title={t("seeker.applicationSuccess.loadErrorTitle")}
        message={t("seeker.applicationSuccess.loadErrorBody")}
        actionHref={ROUTES.JOB_SEEKER_APPLIED_JOBS}
        actionLabel={t("seeker.applicationSuccess.viewAppliedJobs")}
        secondaryAction={
          <button
            type="button"
            onClick={() => void detailQuery.refetch()}
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {t("seeker.common.retry")}
          </button>
        }
      />
    );
  }

  const employmentType =
    formatJobSearchJobType(application.jobType) ||
    formatJobSearchJobType(application.workMode) ||
    "—";
  const companyLogoUrl = resolveMediaUrl(application.companyLogoUrl);
  const statusLabel = t(
    APPLICATION_STATUS_LABEL_KEYS[application.status] ??
      "seeker.status.submitted",
  );

  return (
    <main className="min-h-dvh bg-hero-bg">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <div className="mb-5 sm:mb-6">
          <JobPostedSuccessIcon />
        </div>

        <h1 className="break-words text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("seeker.applicationSuccess.title")}
        </h1>
        <p className="mt-3 max-w-xl break-words text-center text-sm leading-relaxed text-muted sm:text-base">
          {t("seeker.applicationSuccess.body")}
        </p>

        <section className="mt-8 w-full rounded-xl border border-border-subtle bg-surface p-4 shadow-[0_2px_10px_rgba(26,43,60,0.04)] sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-light/60 ring-1 ring-border-subtle">
              {companyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- employer upload URL
                <img
                  src={companyLogoUrl}
                  alt=""
                  className={PROFILE_IMAGE_FIT_CLASSNAME}
                />
              ) : (
                <Building2 className="size-6 text-primary" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {application.jobTitle}
              </h2>
              <p className="text-sm text-muted">
                {application.companyName || t("seeker.common.company")}
              </p>
            </div>
            <span className="inline-flex h-fit max-w-[40%] shrink-0 break-words rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
              {statusLabel}
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              label={t("seeker.applicationSuccess.location")}
              value={application.location || "—"}
            />
            <InfoRow
              label={t("seeker.applicationSuccess.salary")}
              value={application.salaryLabel || "—"}
            />
            <InfoRow
              label={t("seeker.applicationSuccess.employmentType")}
              value={employmentType}
            />
            <InfoRow
              label={t("seeker.applicationSuccess.appliedDate")}
              value={formatAppliedDate(application.appliedAt)}
            />
            <InfoRow
              label={t("seeker.applicationSuccess.applicationStatus")}
              value={statusLabel}
            />
            <InfoRow
              label={t("seeker.applicationSuccess.resumeVersionSubmitted")}
              value={`v${application.resumeVersion}`}
            />
          </dl>
        </section>

        <section className="mt-4 w-full rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground">
            {t("seeker.applicationSuccess.nextTitle")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <NextStep>{t("seeker.applicationSuccess.nextReceives")}</NextStep>
            <NextStep>{t("seeker.applicationSuccess.nextReviews")}</NextStep>
            <NextStep>{t("seeker.applicationSuccess.nextUpdates")}</NextStep>
            <NextStep>{t("seeker.applicationSuccess.nextTrack")}</NextStep>
          </ul>
        </section>

        <div className="mt-8 flex w-full flex-col gap-3 sm:max-w-md">
          <Link
            href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {t("seeker.applicationSuccess.viewAppliedJobs")}
          </Link>
          <Link
            href={ROUTES.FIND_JOBS}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {t("seeker.applicationSuccess.continueBrowsing")}
          </Link>
          <Link
            href={ROUTES.JOB_SEEKER_PROFILE}
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {t("seeker.applicationSuccess.goToProfile")}
          </Link>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-whatsapp/30 bg-benefit-whatsapp-surface px-4 text-sm font-semibold text-whatsapp-dark transition-colors hover:bg-whatsapp-cta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/30"
            >
              <WhatsAppIcon className="text-base text-whatsapp" />
              {t("seeker.applicationSuccess.contactWhatsapp")}
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-hero-bg/80 px-3 py-2.5">
      <dt className="break-words text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground break-words">
        {value}
      </dd>
    </div>
  );
}

function NextStep({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2
        className="mt-0.5 size-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

function CenteredMessage({
  title,
  message,
  actionHref,
  actionLabel,
  secondaryAction,
}: {
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="break-words text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 break-words text-sm text-muted">{message}</p>
        <Link
          href={actionHref}
          className={cn(
            "mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface",
            "hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
        >
          {actionLabel}
        </Link>
        {secondaryAction}
      </div>
    </div>
  );
}

export function ApplicationSuccessPageContent() {
  const t = useTranslate();

  return (
    <JobSeekerAuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-6">
            <p className="text-sm text-muted">{t("seeker.common.loading")}</p>
          </div>
        }
      >
        <ApplicationSuccessBody />
      </Suspense>
    </JobSeekerAuthGuard>
  );
}
