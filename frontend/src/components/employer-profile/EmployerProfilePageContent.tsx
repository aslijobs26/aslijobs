"use client";

import { EmployerCompanyMediaModal } from "@/components/employer-profile/EmployerCompanyMediaModal";
import { EmployerProfileCompletionCircle } from "@/components/employer-profile/EmployerProfileCompletionCircle";
import {
  EmployerProfileEditModal,
  type EmployerProfileEditSection,
} from "@/components/employer-profile/EmployerProfileEditModal";
import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import {
  EmployerSocialBrandIcon,
  type EmployerSocialBrand,
} from "@/components/layout/footer/footer-social-icons";
import {
  EMPLOYER_JOBS_QUERY_KEYS,
} from "@/constants/employer-jobs";
import {
  EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT,
  EMPLOYER_REGISTER_INDUSTRY_OPTIONS,
} from "@/constants/employer-register";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { useCan } from "@/providers/employer-permission-provider";
import { employerProfileQueryKey } from "@/services/employer-login.service";
import {
  updateEmployerProfile,
  type EmployerProfilePublic,
  type UpdateEmployerProfileInput,
} from "@/services/employer-profile.service";
import { fetchEmployerJobStats } from "@/services/employer-jobs.service";
import type { EmployerImageAssetPublic } from "@/services/employer-register.service";
import { cn } from "@/utils/cn";
import { calculateEmployerProfileCompletion } from "@/utils/employer-profile-completion";
import { resolveEmployerPosterImageUrl } from "@/utils/employer-poster-image";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  Gem,
  Globe2,
  Images,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const SOCIAL_BRAND_BADGE_CLASS: Record<EmployerSocialBrand, string> = {
  linkedin: "bg-social-linkedin text-surface",
  facebook: "bg-social-facebook text-surface",
  instagram: "bg-social-instagram text-surface",
  twitter: "bg-foreground text-surface",
  youtube: "bg-social-youtube text-surface",
  website: "bg-primary text-surface",
};

type AboutTab = "about" | "benefits" | "achievements" | "media" | "social";

const BUSINESS_ABOUT_TABS: { id: AboutTab; label: string }[] = [
  { id: "about", label: "About Us" },
  { id: "benefits", label: "Benefits" },
  { id: "media", label: "Media" },
  { id: "social", label: "Social Links" },
];

const INDIVIDUAL_ABOUT_TABS: { id: AboutTab; label: string }[] = [
  { id: "about", label: "About Me" },
  { id: "benefits", label: "Professional Experience" },
  { id: "achievements", label: "Achievements" },
  { id: "social", label: "Professional Links" },
];

const cardClassName =
  "overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm";

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "Unable to update the profile.";
}

function valueOrDash(value: string | number | null | undefined): string {
  if (typeof value === "number") {
    return String(value);
  }
  return value?.toString().trim() || "—";
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "—";
  }
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

function formatCompanySize(
  minimum: number | null,
  maximum: number | null,
): string {
  if (minimum === null && maximum === null) {
    return "—";
  }
  if (minimum !== null && maximum !== null) {
    return `${minimum.toLocaleString("en-IN")} – ${maximum.toLocaleString("en-IN")} employees`;
  }
  return `${(minimum ?? maximum)?.toLocaleString("en-IN")} employees`;
}

function getDisplayName(profile: EmployerProfilePublic): string {
  if (profile.accountType === "individual") {
    return (
      profile.establishmentName.trim() ||
      `${profile.firstName} ${profile.lastName}`.trim()
    );
  }
  return profile.companyName.trim();
}

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "AJ";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function safeExternalHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function ProfileImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string | null;
  alt: string;
  className: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return fallback;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- authenticated upload URL
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function CardHeader({
  title,
  onEdit,
  editLabel,
}: {
  title: string;
  onEdit?: () => void;
  editLabel?: string;
}) {
  return (
    <header className="flex min-h-12 items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-9"
          aria-label={editLabel ?? `Edit ${title}`}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </button>
      ) : null}
    </header>
  );
}

function DetailLine({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 text-xs text-muted">
      <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-medium text-muted">{label}</dt>
      <dd className="mt-1 break-words text-xs font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function EmptyCopy({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border-subtle bg-hero-bg/60 px-4 py-5 text-sm text-muted">
      {children}
    </p>
  );
}

export function EmployerProfilePageContent() {
  const queryClient = useQueryClient();
  const { can, canField } = useCan();
  const canUpdateProfile = can("company_profile", "update");
  const canViewGst = canField("company_profile", "gst");
  const canViewPan = canField("company_profile", "pan");
  const visitMutationAttemptedRef = useRef(false);
  const [aboutTab, setAboutTab] = useState<AboutTab>("about");
  const [editSection, setEditSection] =
    useState<EmployerProfileEditSection | null>(null);
  const [mediaEditorOpen, setMediaEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] =
    useState<EmployerImageAssetPublic | null>(null);

  const profileQuery = useEmployerProfile();

  const jobStatsQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.stats(),
    queryFn: fetchEmployerJobStats,
    staleTime: 2 * 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: updateEmployerProfile,
  });

  const profile = profileQuery.data;

  const markVisitedMutation = useMutation({
    mutationFn: () =>
      updateEmployerProfile({ companyProfileVisited: true }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: employerProfileQueryKey });
      const previous =
        queryClient.getQueryData<EmployerProfilePublic>(
          employerProfileQueryKey,
        );

      if (previous) {
        queryClient.setQueryData<EmployerProfilePublic>(
          employerProfileQueryKey,
          { ...previous, companyProfileVisited: true },
        );
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          employerProfileQueryKey,
          context.previous,
        );
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(employerProfileQueryKey, updated);
    },
  });

  const markCompanyProfileVisited = markVisitedMutation.mutate;
  const isMarkingCompanyProfileVisited = markVisitedMutation.isPending;

  useEffect(() => {
    if (
      profile?.companyProfileVisited === false &&
      !isMarkingCompanyProfileVisited &&
      !visitMutationAttemptedRef.current
    ) {
      visitMutationAttemptedRef.current = true;
      markCompanyProfileVisited();
    }
  }, [
    isMarkingCompanyProfileVisited,
    markCompanyProfileVisited,
    profile?.companyProfileVisited,
  ]);

  const openEditor = (section: EmployerProfileEditSection) => {
    updateMutation.reset();
    setEditSection(section);
  };

  const openMediaEditor = () => {
    updateMutation.reset();
    setMediaEditorOpen(true);
  };

  const saveProfile = async (input: UpdateEmployerProfileInput) => {
    try {
      const updated = await updateMutation.mutateAsync(input);
      queryClient.setQueryData(employerProfileQueryKey, updated);
      setEditSection(null);
      setMediaEditorOpen(false);
      showAppToast("Profile updated.", "success");
    } catch {
      // The mutation error remains visible inside the active editor.
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-4 px-3 py-5 sm:px-5 lg:px-6">
        <div className="h-16 animate-pulse rounded-xl bg-primary-light/40" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.9fr)]">
          <div className="h-[34rem] animate-pulse rounded-xl bg-primary-light/30" />
          <div className="h-[28rem] animate-pulse rounded-xl bg-primary-light/30" />
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 lg:px-6">
        <div className={`${cardClassName} p-8 text-center`}>
          <p className="text-sm font-semibold text-foreground">
            Unable to load your profile.
          </p>
          <button
            type="button"
            onClick={() => void profileQuery.refetch()}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(profile);
  const logoUrl = resolveMediaUrl(
    resolveEmployerPosterImageUrl(profile) || null,
  );
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const industryLabel =
    EMPLOYER_REGISTER_INDUSTRY_OPTIONS.find(
      (option) => option.value === profile.industry,
    )?.label ?? profile.industry;
  const websiteHref = safeExternalHref(profile.website);
  const isVerified =
    profile.registrationStatus === "completed" && profile.isWhatsappVerified;
  const isBusinessProfile = profile.accountType !== "individual";
  const media = profile.companyMedia ?? [];
  const aboutTabs = isBusinessProfile
    ? BUSINESS_ABOUT_TABS
    : INDIVIDUAL_ABOUT_TABS;
  const stats = jobStatsQuery.data?.stats;
  const socialItems: {
    label: string;
    value: string;
    brand: EmployerSocialBrand;
  }[] = [
    {
      label: "LinkedIn",
      value: profile.socialLinks?.linkedin ?? "",
      brand: "linkedin",
    },
    {
      label: "Facebook",
      value: profile.socialLinks?.facebook ?? "",
      brand: "facebook",
    },
    {
      label: "Instagram",
      value: profile.socialLinks?.instagram ?? "",
      brand: "instagram",
    },
    {
      label: "Twitter / X",
      value: profile.socialLinks?.twitter ?? "",
      brand: "twitter",
    },
    {
      label: "YouTube",
      value: profile.socialLinks?.youtube ?? "",
      brand: "youtube",
    },
    {
      label: isBusinessProfile ? "Website" : "Portfolio / Website",
      value: profile.website,
      brand: "website",
    },
  ];
  const activeSocialItems = socialItems.filter((item) =>
    safeExternalHref(item.value),
  );
  const profileCompletion = calculateEmployerProfileCompletion(profile);

  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-clip px-3 pt-5 pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] sm:px-5 md:pb-8 lg:px-6">
      <header className="overflow-hidden rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {isBusinessProfile ? "Company Profile" : "Individual Profile"}
      </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              {isBusinessProfile
                ? "Manage your company information, branding and preferences."
                : "Manage your professional information, profile photo and preferences."}
            </p>
            </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:shrink-0">
            <div className="relative min-w-[14.5rem] overflow-hidden rounded-xl border border-primary/20 bg-primary-light/40 p-3 shadow-xs">
              <div
                className="pointer-events-none absolute -right-7 -top-8 size-24 rounded-full bg-primary/10 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3">
                <EmployerProfileCompletionCircle
                  percentage={profileCompletion.percentage}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-primary">
                    Profile completion
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                    {profileCompletion.isComplete
                      ? "Your profile is complete"
                      : `${profileCompletion.missingCount} ${
                          profileCompletion.missingCount === 1
                            ? "detail"
                            : "details"
                        } remaining`}
                  </p>
                </div>
              </div>
                </div>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {isBusinessProfile
                ? "Preview Company Page"
                : "Preview Profile Page"}
              <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
            </button>
                    </div>
        </div>
      </header>

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.9fr)]">
        <main className="min-w-0 space-y-4">
          <section
            id="profile-section-company"
            data-profile-section="company"
            className={cardClassName}
          >
            <CardHeader
              title={
                isBusinessProfile
                  ? "Company Information"
                  : "Professional Information"
              }
              onEdit={canUpdateProfile ? () => openEditor("company") : undefined}
            />
            <div className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-hero-bg">
                  <ProfileImage
                    src={logoUrl}
                    alt={`${displayName} ${
                      isBusinessProfile ? "logo" : "profile photo"
                    }`}
                    className="size-full object-cover"
                    fallback={
                      <span className="text-2xl font-bold text-primary">
                        {getInitials(displayName)}
                      </span>
                    }
                      />
                    </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-bold text-foreground">
                      {displayName || "Profile name not provided"}
                    </h2>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-1 text-[0.6875rem] font-semibold text-primary">
                        <BadgeCheck className="size-3.5" aria-hidden="true" />
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <DetailLine icon={MapPin}>
                      {valueOrDash(location)}
                    </DetailLine>
                    <DetailLine icon={Building2}>
                      {valueOrDash(industryLabel)}
                    </DetailLine>
                    {isBusinessProfile ? (
                      <DetailLine icon={Users}>
                        {formatCompanySize(
                          profile.minimumEmployees,
                          profile.maximumEmployees,
                        )}
                      </DetailLine>
                    ) : null}
                    <DetailLine icon={Globe2}>
                      {websiteHref ? (
                        <a
                          href={websiteHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all font-medium text-primary hover:underline"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </DetailLine>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted">
                    {profile.companyDescription ||
                      profile.aboutUs ||
                      (isBusinessProfile
                        ? "No company description has been added yet."
                        : "No professional summary has been added yet.")}
                  </p>
                </div>
              </div>

              {isBusinessProfile ? (
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4 sm:grid-cols-3 lg:grid-cols-5">
                  <MetadataItem
                    label="Founded"
                    value={valueOrDash(profile.foundedYear)}
                  />
                  <MetadataItem
                    label="Company Type"
                    value={valueOrDash(profile.companyType)}
                  />
                  {canViewGst ? (
                    <MetadataItem
                      label="GST Number"
                      value={valueOrDash(profile.gstNumber)}
                    />
                  ) : null}
                  {canViewPan ? (
                    <MetadataItem
                      label="PAN Number"
                      value={valueOrDash(profile.panNumber)}
                    />
                  ) : null}
                  <MetadataItem
                    label="Registration Number"
                    value={valueOrDash(profile.registrationNumber)}
                  />
                </dl>
              ) : null}
              </div>
          </section>

          <section
            id="profile-section-about"
            data-profile-section="about"
            className={cardClassName}
          >
            <CardHeader
              title={isBusinessProfile ? "About Company" : "About Me"}
              onEdit={canUpdateProfile ? () => openEditor("about") : undefined}
            />
            <div className="grid min-w-0 md:grid-cols-[9rem_minmax(0,1fr)]">
              <div
                className="flex flex-wrap gap-1 border-b border-border-subtle p-3 md:flex-col md:flex-nowrap md:border-r md:border-b-0"
                role="tablist"
                aria-label={
                  isBusinessProfile
                    ? "About company sections"
                    : "About profile sections"
                }
              >
                {aboutTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={aboutTab === tab.id}
                    onClick={() => setAboutTab(tab.id)}
                    className={cn(
                      "min-h-11 shrink-0 rounded-lg px-3 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:min-h-10",
                      aboutTab === tab.id
                        ? "bg-primary-light text-primary"
                        : "text-muted hover:bg-hero-bg hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>

              <div className="min-w-0 p-4">
                {aboutTab === "about" ? (
                  <div>
                    {profile.aboutUs ? (
                      <p className="whitespace-pre-line text-sm leading-6 text-muted">
                        {profile.aboutUs}
                      </p>
                    ) : (
                      <EmptyCopy>
                        {isBusinessProfile
                          ? "No about-us information has been added."
                          : "No introduction has been added yet."}
                      </EmptyCopy>
                    )}
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      {(isBusinessProfile
                        ? [
                            {
                              title: "Vision",
                              value: profile.vision,
                              icon: Eye,
                            },
                            {
                              title: "Mission",
                              value: profile.mission,
                              icon: Target,
                            },
                            {
                              title: "Values",
                              value: profile.values,
                              icon: Gem,
                            },
                          ]
                        : [
                            {
                              title: "Career Vision",
                              value: profile.vision,
                              icon: Eye,
                            },
                            {
                              title: "Professional Goals",
                              value: profile.mission,
                              icon: Target,
                            },
                          ]
                      ).map((item) => {
                        const Icon = item.icon;
                        return (
                          <article
                            key={item.title}
                            className="rounded-xl border border-border-subtle bg-hero-bg/50 p-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                                <Icon className="size-4" aria-hidden="true" />
                              </span>
                              <h3 className="text-sm font-bold text-foreground">
                                {item.title}
                              </h3>
              </div>
                            <p className="mt-2 text-xs leading-5 text-muted">
                              {item.value || "Not provided"}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {aboutTab === "benefits" ? (
                  profile.benefits ? (
                    <p className="whitespace-pre-line text-sm leading-6 text-muted">
                      {profile.benefits}
                    </p>
                  ) : (
                    <EmptyCopy>
                      {isBusinessProfile
                        ? "No company benefits have been added."
                        : "No professional experience has been added yet."}
                    </EmptyCopy>
                  )
                ) : null}

                {aboutTab === "achievements" ? (
                  profile.values ? (
                    <p className="whitespace-pre-line text-sm leading-6 text-muted">
                      {profile.values}
                    </p>
                  ) : (
                    <EmptyCopy>No achievements have been added yet.</EmptyCopy>
                  )
                ) : null}

                {aboutTab === "media" ? (
                  media.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {media.slice(0, 6).map((asset, index) => (
                        <button
                          key={asset.publicId || asset.storagePath}
                          type="button"
                          onClick={() => setPreviewImage(asset)}
                          className="aspect-[4/3] overflow-hidden rounded-lg border border-border-subtle bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label={`Preview company image ${index + 1}`}
                        >
                          <ProfileImage
                            src={resolveMediaUrl(asset.url)}
                            alt={asset.originalName || `Company image ${index + 1}`}
                            className="size-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                            fallback={<Images className="size-5 text-muted" />}
                          />
                        </button>
                      ))}
              </div>
                  ) : (
                    <EmptyCopy>No company media has been uploaded.</EmptyCopy>
                  )
                ) : null}

                {aboutTab === "social" ? (
                  activeSocialItems.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {activeSocialItems.map((item) => {
                        const href = safeExternalHref(item.value);
                        return (
                          <a
                            key={item.label}
                            href={href ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 items-center gap-2 rounded-lg border border-border-subtle px-3 py-2.5 text-sm text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          >
                            <span
                              className={cn(
                                "inline-flex size-6 shrink-0 items-center justify-center rounded-md",
                                SOCIAL_BRAND_BADGE_CLASS[item.brand],
                              )}
                              aria-hidden="true"
                            >
                              <EmployerSocialBrandIcon
                                brand={item.brand}
                                className="size-3.5"
                              />
                            </span>
                            <span className="truncate">{item.value}</span>
                          </a>
                        );
                      })}
            </div>
                  ) : (
                    <EmptyCopy>
                      {isBusinessProfile
                        ? "No social links have been added."
                        : "No professional links have been added."}
                    </EmptyCopy>
                  )
                ) : null}
              </div>
            </div>
          </section>

          {isBusinessProfile ? (
            <section
              id="profile-section-media"
              data-profile-section="media"
              className={cardClassName}
            >
              <CardHeader
                title="Company Media"
                onEdit={canUpdateProfile ? openMediaEditor : undefined}
                editLabel="Edit company media"
              />
              <div className="p-4">
                {media.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {media.map((asset, index) => (
                        <button
                          key={asset.publicId || asset.storagePath}
                          type="button"
                          onClick={() => setPreviewImage(asset)}
                          className="group aspect-[4/3] min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label={`View ${asset.originalName || `company image ${index + 1}`}`}
                        >
                          <ProfileImage
                            src={resolveMediaUrl(asset.url)}
                            alt={
                              asset.originalName || `Company image ${index + 1}`
                            }
                            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                            fallback={<Images className="size-6 text-muted" />}
                          />
                        </button>
                      ))}
                      {canUpdateProfile &&
                      media.length < profile.companyMediaLimit ? (
                        <button
                          type="button"
                          onClick={openMediaEditor}
                          className="flex aspect-[4/3] min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary-light/30 p-3 text-primary hover:border-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label="Add more company images"
                        >
                          <Plus className="size-5" aria-hidden="true" />
                          <span className="text-xs font-semibold">Add More</span>
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      You can upload up to {profile.companyMediaLimit} images (
                      {EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT}).
                    </p>
          </>
        ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle bg-hero-bg/60 p-4 text-center">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <Images className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold text-foreground">
                      No company media uploaded yet
                    </h3>
                    <p className="mt-1 max-w-md text-xs text-muted">
                      Help candidates understand your workplace and team.{" "}
                      {EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT}.
                    </p>
                    {canUpdateProfile ? (
                      <button
                        type="button"
                        onClick={openMediaEditor}
                        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary-light/30 px-4 text-sm font-semibold text-primary hover:border-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        aria-label="Add company media"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        Add More
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="min-w-0 space-y-4">
          <section className={cardClassName}>
            <CardHeader
              title={isBusinessProfile ? "Company Snapshot" : "Recruiter Summary"}
            />
            <dl className="divide-y divide-border-subtle px-4">
              {[
                {
                  label: "Jobs Posted",
                  value: stats?.totalJobs,
                  icon: BriefcaseBusiness,
                },
                {
                  label: "Active Jobs",
                  value: stats?.activeJobs,
                  icon: FileCheck2,
                },
                {
                  label: "Total Applications",
                  value: stats?.applications,
                  icon: Users,
                },
                {
                  label: "Member Since",
                  value: formatDate(profile.createdAt),
                  icon: CalendarDays,
                },
                {
                  label: "Last Updated",
                  value: formatDate(profile.updatedAt),
                  icon: Clock3,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <dt className="flex min-w-0 items-center gap-2 text-xs text-muted">
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </dt>
                    <dd className="shrink-0 text-xs font-bold tabular-nums text-foreground">
                      {jobStatsQuery.isLoading &&
                      typeof item.value === "undefined"
                        ? "…"
                        : valueOrDash(item.value)}
                    </dd>
              </div>
                );
              })}
            </dl>
          </section>

          <section
            id="profile-section-contact"
            data-profile-section="contact"
            className={cardClassName}
          >
            <CardHeader
              title="Contact Information"
              onEdit={canUpdateProfile ? () => openEditor("contact") : undefined}
            />
            <dl className="space-y-3 p-4">
              {[
                {
                  label: isBusinessProfile ? "Contact Person" : "Full Name",
                  value: `${profile.firstName} ${profile.lastName}`.trim(),
                  icon: UserRound,
                },
                {
                  label: isBusinessProfile ? "Designation" : "Current Role",
                  value: profile.contactDesignation,
                  icon: BriefcaseBusiness,
                },
                { label: "Email", value: profile.emailAddress, icon: Mail },
                {
                  label: "Phone",
                  value: profile.whatsappNumber,
                  icon: Phone,
                },
                {
                  label: "Alternate Phone",
                  value: profile.alternatePhone,
                  icon: Phone,
                },
                {
                  label: "Address",
                  value: [
                    profile.companyAddress,
                    profile.city,
                    profile.state,
                    profile.pincode,
                  ]
                    .filter(Boolean)
                    .join(", "),
                  icon: MapPin,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 text-xs"
                  >
                    <dt className="flex items-start gap-2 text-muted">
                      <Icon
                        className="mt-0.5 size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {item.label}
                    </dt>
                    <dd className="break-words font-medium text-foreground">
                      {valueOrDash(item.value)}
                    </dd>
              </div>
                );
              })}
            </dl>
          </section>

          <section
            id="profile-section-social"
            data-profile-section="social"
            className={cardClassName}
          >
            <CardHeader
              title={isBusinessProfile ? "Social Links" : "Professional Links"}
              onEdit={canUpdateProfile ? () => openEditor("social") : undefined}
            />
            <div className="divide-y divide-border-subtle px-4">
              {activeSocialItems.length > 0 ? (
                activeSocialItems.map((item) => {
                  const href = safeExternalHref(item.value);
                  return (
                    <a
                      key={item.label}
                      href={href ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 min-w-0 items-center gap-2 py-3 text-xs text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      <span
                        className={cn(
                          "inline-flex size-6 shrink-0 items-center justify-center rounded-md",
                          SOCIAL_BRAND_BADGE_CLASS[item.brand],
                        )}
                        aria-hidden="true"
                      >
                        <EmployerSocialBrandIcon
                          brand={item.brand}
                          className="size-3.5"
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.value}
                      </span>
                      <ExternalLink
                        className="size-3.5 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                    </a>
                  );
                })
              ) : (
                <p className="py-6 text-center text-sm text-muted">
                  {isBusinessProfile
                    ? "No social links added."
                    : "No professional links added."}
                </p>
              )}
            </div>
          </section>
        </aside>
            </div>

      {editSection ? (
        <EmployerProfileEditModal
          section={editSection}
          profile={profile}
          isSaving={updateMutation.isPending}
          errorMessage={
            updateMutation.isError
              ? getErrorMessage(updateMutation.error)
              : null
          }
          onClose={() => setEditSection(null)}
          onSave={saveProfile}
        />
      ) : null}

      {mediaEditorOpen && isBusinessProfile ? (
        <EmployerCompanyMediaModal
          profile={profile}
          isSaving={updateMutation.isPending}
          errorMessage={
            updateMutation.isError
              ? getErrorMessage(updateMutation.error)
              : null
          }
          onClose={() => setMediaEditorOpen(false)}
          onSave={async ({ files, removedKeys, order }) => {
            await saveProfile({
              companyMediaFiles: files,
              removeCompanyMediaPublicIds: removedKeys,
              companyMediaOrder: order,
            });
          }}
        />
      ) : null}

      {previewOpen ? (
        <EmployerProfileDialog
          title={
            isBusinessProfile
              ? "Company page preview"
              : "Individual profile preview"
          }
          description="Preview of the information currently saved on your profile."
          onClose={() => setPreviewOpen(false)}
          wide
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-hero-bg">
                <ProfileImage
                  src={logoUrl}
                  alt={`${displayName} ${
                    isBusinessProfile ? "logo" : "profile photo"
                  }`}
                  className="size-full object-cover"
                  fallback={
                    <span className="text-2xl font-bold text-primary">
                      {getInitials(displayName)}
                    </span>
                  }
          />
        </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-foreground">
                  {displayName}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {[industryLabel, location].filter(Boolean).join(" · ") || "—"}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {profile.companyDescription ||
                    profile.aboutUs ||
                    (isBusinessProfile
                      ? "No company description has been added."
                      : "No professional summary has been added.")}
                </p>
              </div>
            </div>
            {isBusinessProfile && media.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.slice(0, 6).map((asset, index) => (
                  <div
                    key={asset.publicId || asset.storagePath}
                    className="aspect-[4/3] overflow-hidden rounded-xl border border-border-subtle bg-hero-bg"
                  >
                    <ProfileImage
                      src={resolveMediaUrl(asset.url)}
                      alt={asset.originalName || `Company image ${index + 1}`}
                      className="size-full object-cover"
                      fallback={<Images className="size-6 text-muted" />}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </EmployerProfileDialog>
        ) : null}

      {previewImage && isBusinessProfile ? (
        <EmployerProfileDialog
          title={previewImage.originalName || "Company image"}
          onClose={() => setPreviewImage(null)}
          wide
        >
          <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl bg-hero-bg">
            <ProfileImage
              src={resolveMediaUrl(previewImage.url)}
              alt={previewImage.originalName || "Company media preview"}
              className="max-h-[65dvh] max-w-full object-contain"
              fallback={<Images className="size-8 text-muted" />}
            />
          </div>
        </EmployerProfileDialog>
      ) : null}
    </div>
  );
}
