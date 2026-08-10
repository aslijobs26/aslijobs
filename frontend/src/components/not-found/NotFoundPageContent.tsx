import asliLogo from "@/assets/AsliLogo.svg";
import { BRAND_TAGLINE } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import {
  ArrowRight,
  Briefcase,
  FileText,
  Headset,
  Home,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const QUICK_ACTIONS = [
  {
    title: "Browse Jobs",
    description: "Explore thousands of latest job openings.",
    href: ROUTES.FIND_JOBS,
    icon: Briefcase,
    iconClassName: "bg-benefit-whatsapp-surface text-benefit-whatsapp-icon",
  },
  {
    title: "Create Resume",
    description: "Build your professional resume in minutes.",
    href: ROUTES.JOB_SEEKER_MY_RESUME,
    icon: FileText,
    iconClassName: "bg-resource-resume-icon-surface text-resource-resume-icon",
  },
  {
    title: "My Applications",
    description: "Track your applications and stay updated.",
    href: ROUTES.JOB_SEEKER_APPLIED_JOBS,
    icon: UserRound,
    iconClassName:
      "bg-resource-interview-icon-surface text-resource-interview-icon",
  },
  {
    title: "Help & Support",
    description: "We're here to help you at every step.",
    href: ROUTES.HELP_CENTER,
    icon: Headset,
    iconClassName:
      "bg-resource-salary-icon-surface text-resource-salary-icon",
  },
] as const;

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-12 sm:gap-2.5 sm:px-6 sm:text-sm";

const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-12 sm:gap-2.5 sm:px-6 sm:text-sm";

function OopsAccentMarks({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";

  return (
    <svg
      viewBox="0 0 18 22"
      className={
        isLeft
          ? "h-[1.15rem] w-[0.95rem] shrink-0 self-center sm:h-5 sm:w-4"
          : "h-[1.15rem] w-[0.95rem] shrink-0 self-start -translate-y-1 sm:h-5 sm:w-4 sm:-translate-y-1.5"
      }
      fill="none"
      aria-hidden="true"
      style={{
        color: "color-mix(in srgb, var(--color-primary) 52%, #b7c4bf)",
      }}
    >
      {isLeft ? (
        <>
          {/* Upper-left dash (~10 o'clock) */}
          <path
            d="M14.5 7.5C11.5 6.2 8.2 4.6 5 3"
            stroke="currentColor"
            strokeWidth="2.35"
            strokeLinecap="round"
          />
          {/* Lower-left dash (~8 o'clock) */}
          <path
            d="M14.5 14.5C11.2 15.6 8 17.2 5 19"
            stroke="currentColor"
            strokeWidth="2.35"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Upper-right dash (~2 o'clock) */}
          <path
            d="M3.5 7.5C6.8 6.2 10 4.6 13 3"
            stroke="currentColor"
            strokeWidth="2.35"
            strokeLinecap="round"
          />
          {/* Lower-right dash (~4 o'clock) */}
          <path
            d="M3.5 14.5C6.8 15.6 10 17.2 13 19"
            stroke="currentColor"
            strokeWidth="2.35"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export function NotFoundPageContent() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FDFDFD]">
      <header className="bg-[#FDFDFD]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={ROUTES.HOME}
            aria-label="AsliJobs home"
            className="flex min-w-0 flex-col items-start gap-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Image
              src={asliLogo}
              alt=""
              width={213}
              height={70}
              className="block h-8 w-auto sm:h-9"
              priority
              aria-hidden
            />
            <p className="max-w-[12rem] truncate text-[8px] font-bold leading-tight text-muted sm:text-[9px]">
              {BRAND_TAGLINE}
            </p>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href={ROUTES.FIND_JOBS}
              className={cn(
                primaryButtonClassName,
                "min-h-9 gap-2 rounded-lg px-3.5 text-xs sm:min-h-12 sm:gap-2.5 sm:rounded-xl sm:px-6 sm:text-sm",
              )}
            >
              Browse Jobs
            </Link>
            <Link
              href={ROUTES.HOME}
              aria-label="Go to home"
              className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Home className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col bg-[#FDFDFD]">
        <section className="mx-auto w-full max-w-6xl bg-[#FDFDFD] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid items-center gap-8 bg-[#FDFDFD] lg:grid-cols-2 lg:gap-10 xl:gap-14">
            <div className="order-1 flex min-w-0 flex-col items-start text-left">
              <p className="inline-flex items-center gap-1.5 text-lg font-extrabold leading-none tracking-tight text-foreground sm:gap-2 sm:text-[1.5rem]">
                <OopsAccentMarks side="left" />
                <span>Oops!</span>
                <OopsAccentMarks side="right" />
              </p>

              <h1
                className="mt-1 text-[3.5rem] font-black leading-none tracking-[-0.04em] text-primary sm:text-[5.75rem] lg:text-[6.5rem]"
                style={{
                  textShadow:
                    "3px 4px 0 color-mix(in srgb, var(--color-primary-soft) 28%, white), 0 10px 28px color-mix(in srgb, var(--color-primary) 16%, transparent)",
                }}
              >
                404
              </h1>

              <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-[1.75rem] lg:text-[2rem]">
                Page Not Found
              </h2>

              <p className="mt-3 max-w-md text-xs leading-6 text-muted sm:text-base sm:leading-7">
                The page you&apos;re looking for seems to have
                <br className="hidden sm:block" /> gone missing or moved to
                another location.
              </p>

              <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <Link href={ROUTES.FIND_JOBS} className={primaryButtonClassName}>
                  <Briefcase className="size-4 shrink-0" aria-hidden="true" />
                  Browse Jobs
                </Link>
                <Link href={ROUTES.HOME} className={secondaryButtonClassName}>
                  <Home className="size-4 shrink-0" aria-hidden="true" />
                  Go to Home
                </Link>
              </div>

              <p className="mt-6 text-xs leading-relaxed text-muted sm:text-[0.95rem]">
                Let&apos;s get you back on track 👋
              </p>
            </div>

            <div className="order-2 flex min-w-0 items-center justify-center overflow-visible bg-[#FDFDFD] lg:justify-end">
              <Image
                src="/images/404-illustration.png"
                alt="Illustration of a job seeker finding a better path after a page not found error"
                width={1024}
                height={652}
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 720px"
                className="h-auto w-full max-w-2xl bg-[#FDFDFD] object-contain object-center sm:max-w-3xl lg:w-[130%] lg:max-w-[46rem] lg:-mr-6 xl:max-w-[52rem]"
              />
            </div>
          </div>

          <nav
            aria-label="Quick actions"
            className="mt-10 overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_8px_24px_rgba(26,43,60,0.06)] sm:mt-12"
          >
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_ACTIONS.map((action, index) => {
                const Icon = action.icon;
                return (
                  <li
                    key={action.title}
                    className={cn(
                      "border-border-subtle",
                      index > 0 && "border-t sm:border-t-0",
                      index % 2 === 1 && "sm:border-l",
                      index > 0 && "lg:border-l",
                      index >= 2 && "sm:border-t lg:border-t-0",
                    )}
                  >
                    <Link
                      href={action.href}
                      className="group flex h-full flex-col px-5 py-5 transition-colors hover:bg-hero-bg/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:px-6 sm:py-6"
                    >
                      <span
                        className={cn(
                          "inline-flex size-11 items-center justify-center rounded-full",
                          action.iconClassName,
                        )}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="mt-3 text-sm font-bold text-foreground sm:text-base">
                        {action.title}
                      </span>
                      <span className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                        {action.description}
                      </span>
                      <span className="mt-4 inline-flex text-primary transition-transform group-hover:translate-x-0.5">
                        <ArrowRight className="size-4" aria-hidden="true" />
                        <span className="sr-only">
                          Go to {action.title}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section className="mt-12 pb-4 text-center sm:mt-14">
            <h2 className="text-lg font-bold text-primary sm:text-2xl">
              Still need help?
            </h2>
            <p className="mt-2 text-xs text-muted sm:text-base">
              Our support team is ready to assist you.
            </p>
            <Link
              href={ROUTES.HELP_CENTER}
              className={cn(secondaryButtonClassName, "mt-5")}
            >
              <Headset className="size-4 shrink-0" aria-hidden="true" />
              Contact Support
            </Link>
          </section>
        </section>
      </main>
    </div>
  );
}
