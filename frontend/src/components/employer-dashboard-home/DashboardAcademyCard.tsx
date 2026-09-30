"use client";

import academyIllustration from "@/assets/employer-dashboard/academy-illustration.png";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function DashboardAcademyCard() {
  const t = useTranslate();

  return (
    <section className="relative min-h-28 overflow-hidden rounded-xl border border-resource-resume-icon-surface bg-resource-resume-surface px-5 py-4 shadow-sm">
      <div className="relative z-10 min-w-0 max-w-[60%]">
        <h2 className="break-words text-sm font-bold text-foreground">
          {t("employer.dashboard.academyTitle")}
        </h2>
        <p className="mt-1 break-words text-xs leading-relaxed text-muted">
          {t("employer.dashboard.academyDescription")}
        </p>
        <Link
          href={ROUTES.RESOURCES}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-resource-resume-icon transition-colors hover:text-benefit-languages-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-resource-resume-icon/30"
        >
          {t("employer.dashboard.comingSoon")}
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
