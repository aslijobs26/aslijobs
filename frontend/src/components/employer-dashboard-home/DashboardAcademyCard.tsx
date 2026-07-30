"use client";

import academyIllustration from "@/assets/employer-dashboard/academy-illustration.png";
import {
  EMPLOYER_DASHBOARD_ACADEMY_CTA,
  EMPLOYER_DASHBOARD_ACADEMY_DESCRIPTION,
  EMPLOYER_DASHBOARD_ACADEMY_TITLE,
} from "@/constants/employer-dashboard-home";
import { ROUTES } from "@/constants/routes";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function DashboardAcademyCard() {
  return (
    <section className="relative min-h-28 overflow-hidden rounded-xl border border-resource-resume-icon-surface bg-resource-resume-surface px-5 py-4 shadow-sm">
      <div className="relative z-10 max-w-[60%]">
        <h2 className="text-sm font-bold text-foreground">
          {EMPLOYER_DASHBOARD_ACADEMY_TITLE}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {EMPLOYER_DASHBOARD_ACADEMY_DESCRIPTION}
        </p>
        <Link
          href={ROUTES.RESOURCES}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-resource-resume-icon transition-colors hover:text-benefit-languages-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-resource-resume-icon/30"
        >
          {EMPLOYER_DASHBOARD_ACADEMY_CTA}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <Image
        src={academyIllustration}
        alt=""
        sizes="(max-width: 1279px) 7rem, 6.5rem"
        className="pointer-events-none absolute bottom-2 right-3 h-auto w-24 object-contain sm:w-28 xl:w-24"
      />
    </section>
  );
}
