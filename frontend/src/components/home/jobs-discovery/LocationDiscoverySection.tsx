"use client";

import { translateJobCount } from "@/components/home/home-i18n";
import {
  JOB_CITIES,
  JOB_CITIES_VIEW_ALL_HREF,
  JOB_STATES,
  JOB_STATES_VIEW_ALL_HREF,
} from "@/constants/job-locations";
import { useTranslate } from "@/i18n/translate";
import type { JobLocationItem } from "@/types/jobs-discovery";
import { LocationJobList } from "./LocationJobList";

export function LocationDiscoverySection() {
  const t = useTranslate();

  const localizeCounts = (items: JobLocationItem[]): JobLocationItem[] =>
    items.map((item) => ({
      ...item,
      jobCount: translateJobCount(item.jobCount, t),
    }));

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0">
      <div className="border-b border-border-subtle lg:pr-8">
        <LocationJobList
          title={t("home.jobsDiscovery.statesTitle")}
          titleId="browse-jobs-by-state"
          actionLabel={t("home.jobsDiscovery.statesAction")}
          actionHref={JOB_STATES_VIEW_ALL_HREF}
          items={localizeCounts(JOB_STATES)}
          iconType="state"
        />
      </div>

      <div className="border-b border-border-subtle lg:border-l lg:pl-8">
        <LocationJobList
          title={t("home.jobsDiscovery.citiesTitle")}
          titleId="browse-jobs-by-city"
          actionLabel={t("home.jobsDiscovery.citiesAction")}
          actionHref={JOB_CITIES_VIEW_ALL_HREF}
          items={localizeCounts(JOB_CITIES)}
          iconType="city"
        />
      </div>
    </div>
  );
}
