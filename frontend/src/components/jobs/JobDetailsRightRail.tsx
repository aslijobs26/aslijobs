"use client";

import indiaPromoImage from "@/assets/job-details-india-promo.png";
import whatsappPromoImage from "@/assets/job-details-whatsapp-promo.png";
import { ProfileStrengthCircle } from "@/components/job-seeker-profile/ProfileStrengthCircle";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import {
  JOB_DETAILS_SAFETY_TIPS,
  JOB_DETAILS_WHY_POINTS,
} from "@/constants/job-details-page";
import { JOB_SEEKER_RESUME_QUERY_KEY } from "@/constants/job-seeker-profile";
import { ROUTES } from "@/constants/routes";
import { useJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import { fetchMyResume } from "@/services/job-seeker-resume.service";
import { computeProfileStrength } from "@/utils/job-seeker-profile";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

const WHY_ICONS: Record<string, LucideIcon> = {
  "no-app": Smartphone,
  whatsapp: MessageCircle,
  trusted: ShieldCheck,
  local: MapPin,
};

export function JobDetailsRightRail() {
  const whatsappExternal = WHATSAPP_JOIN_URL.startsWith("http");
  const profileQuery = useJobSeekerProfile();
  const resumeQuery = useQuery({
    queryKey: JOB_SEEKER_RESUME_QUERY_KEY,
    queryFn: fetchMyResume,
    enabled: Boolean(profileQuery.data),
    staleTime: 60_000,
  });

  const strength = useMemo(() => {
    if (!profileQuery.data) {
      return { percent: 0, message: "Finish your profile to unlock better job matches." };
    }
    return computeProfileStrength(profileQuery.data, resumeQuery.data);
  }, [profileQuery.data, resumeQuery.data]);

  const isAuthenticated = Boolean(profileQuery.data);
  const isProfileComplete = strength.percent >= 100;
  const profileHref = isAuthenticated
    ? ROUTES.JOB_SEEKER_PROFILE
    : ROUTES.JOB_SEEKER_REGISTER;
  const profileTitle = isProfileComplete
    ? "Profile Complete"
    : "Complete Your Profile";
  const profileDescription = isAuthenticated
    ? isProfileComplete
      ? strength.message || "Your profile looks great for job matching."
      : strength.message ||
        "Finish your profile to unlock better job matches."
    : "Finish your profile to unlock better job matches.";
  const profileCtaLabel = isAuthenticated
    ? isProfileComplete
      ? "View Profile"
      : "Complete Profile"
    : "Complete Profile";

  return (
    <aside className="flex flex-col gap-3.5" aria-label="AsliJobs highlights">
      <section className="relative overflow-hidden rounded-xl bg-[#F4F9F6] shadow-[0_6px_16px_rgba(18,140,126,0.12)]">
        <Image
          src={whatsappPromoImage}
          alt=""
          className="h-auto w-full"
          sizes="(min-width: 1280px) 270px, (min-width: 1024px) 250px, 100vw"
          priority={false}
        />
        <div className="pointer-events-none absolute inset-0 p-3.5 pr-[42%] sm:p-4 sm:pr-[40%]">
          <h2 className="text-[13px] leading-snug font-bold tracking-tight sm:text-[14px]">
            <span className="block text-[#2F6B4F]">Get Jobs Instantly</span>
            <span className="block text-[#1A1A1A]">on WhatsApp</span>
          </h2>
          <p className="mt-1.5 max-w-[11rem] text-[10px] leading-relaxed text-[#5B6B66] sm:text-[11px]">
            Receive instant job alerts directly on WhatsApp.
          </p>
        </div>
        <Link
          href={WHATSAPP_JOIN_URL}
          target={whatsappExternal ? "_blank" : undefined}
          rel={whatsappExternal ? "noopener noreferrer" : undefined}
          className="absolute bottom-[12%] left-[2%] z-10 flex h-[21%] w-[49%] items-center justify-center pl-[10%] pr-1 text-[7.5px] font-semibold leading-none tracking-tight text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/40 sm:text-[8px]"
          aria-label="Join WhatsApp"
        >
          Join WhatsApp
        </Link>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_4px_rgba(26,43,60,0.04)]">
        <div className="flex items-center gap-3">
          <ProfileStrengthCircle percentage={strength.percent} size={48} />
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-foreground">
              {profileTitle}
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {profileDescription}
            </p>
          </div>
        </div>
        <Link
          href={profileHref}
          className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-employer-button px-3 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-employer-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-employer-button/30"
        >
          {profileCtaLabel}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </section>

      <section className="rounded-xl border border-employer-cta bg-employer-cta/50 p-3.5 shadow-[0_1px_4px_rgba(26,43,60,0.04)]">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-employer-button">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">
              Stay Safe with AsliJobs
            </h2>
            <ul className="mt-2 space-y-1.5">
              {JOB_DETAILS_SAFETY_TIPS.slice(0, 3).map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-1.5 text-[11px] leading-snug text-muted"
                >
                  <CheckCircle2
                    className="mt-0.5 size-3 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl shadow-[0_6px_16px_rgba(14,133,133,0.16)]">
        <Image
          src={indiaPromoImage}
          alt="Thousands of verified jobs. Hiring across India. Trusted by thousands."
          className="h-auto w-full"
          sizes="(min-width: 1280px) 270px, (min-width: 1024px) 250px, 100vw"
          priority={false}
        />
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_4px_rgba(26,43,60,0.04)]">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            <BriefcaseBusiness className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-foreground">
              Are you hiring workers?
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Post a job and reach verified candidates on WhatsApp.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.POST_JOB}
          className="mt-3.5 inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Post a Job
        </Link>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_4px_rgba(26,43,60,0.04)]">
        <h2 className="sr-only">Why AsliJobs?</h2>
        <ul className="grid grid-cols-2 gap-3">
          {JOB_DETAILS_WHY_POINTS.map((point) => {
            const Icon = WHY_ICONS[point.id] ?? ShieldCheck;
            return (
              <li
                key={point.id}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-light text-primary">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="text-[10px] leading-snug font-semibold text-foreground">
                  {point.title}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
