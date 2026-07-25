import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import {
  JOB_DETAILS_SAFETY_TIPS,
  JOB_DETAILS_WHY_POINTS,
} from "@/constants/job-details-page";
import { ROUTES } from "@/constants/routes";
import indiaPromoImage from "@/assets/job-details-india-promo.png";
import whatsappPromoImage from "@/assets/job-details-whatsapp-promo.png";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const WHY_ICONS: Record<string, LucideIcon> = {
  "no-app": Smartphone,
  whatsapp: MessageCircle,
  trusted: ShieldCheck,
  local: MapPin,
};

export function JobDetailsRightRail() {
  const whatsappExternal = WHATSAPP_JOIN_URL.startsWith("http");

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
          <div
            className="relative grid size-12 place-items-center"
            aria-hidden="true"
          >
            <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-primary-light"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeDasharray={`${0.8 * 2 * Math.PI * 15} ${2 * Math.PI * 15}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-primary">
              80%
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-foreground">
              Complete Your Profile
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Finish your profile to unlock better job matches.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.JOB_SEEKER_REGISTER}
          className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-employer-button px-3 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-employer-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-employer-button/30"
        >
          Complete Profile
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
