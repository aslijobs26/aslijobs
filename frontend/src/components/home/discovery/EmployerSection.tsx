"use client";

import { TOP_EMPLOYERS } from "@/constants/employers";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { DiscoverySectionHeader } from "./DiscoverySectionHeader";
import { EmployerCarousel } from "./EmployerCarousel";

export function EmployerSection() {
  const t = useTranslate();

  return (
    <section aria-labelledby="top-employers-hiring-now">
      <DiscoverySectionHeader
        title={t("home.discovery.employersTitle")}
        titleId="top-employers-hiring-now"
        actionLabel={t("home.discovery.employersAction")}
        actionHref={ROUTES.EMPLOYERS}
      />

      <EmployerCarousel employers={TOP_EMPLOYERS} />
    </section>
  );
}
