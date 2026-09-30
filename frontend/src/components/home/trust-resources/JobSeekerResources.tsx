"use client";

import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import { RESOURCE_KEYS } from "@/components/home/home-i18n";
import { JOB_SEEKER_RESOURCES } from "@/constants/job-seeker-resources";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { ResourceCard } from "./ResourceCard";

export function JobSeekerResources() {
  const t = useTranslate();

  return (
    <section aria-labelledby="job-seeker-resources">
      <DiscoverySectionHeader
        title={t("home.trust.resourcesTitle")}
        titleId="job-seeker-resources"
        actionLabel={t("home.trust.resourcesAction")}
        actionHref={ROUTES.RESOURCES}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {JOB_SEEKER_RESOURCES.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={{
              ...resource,
              title: t(RESOURCE_KEYS[resource.icon].title),
              description: t(RESOURCE_KEYS[resource.icon].description),
            }}
          />
        ))}
      </div>
    </section>
  );
}
