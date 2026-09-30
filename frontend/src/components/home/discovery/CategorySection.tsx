"use client";

import {
  CATEGORY_NAME_KEYS,
  translateJobCount,
} from "@/components/home/home-i18n";
import { JOB_CATEGORIES } from "@/constants/job-categories";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { CategoryCard } from "./CategoryCard";
import { DiscoverySectionHeader } from "./DiscoverySectionHeader";

export function CategorySection() {
  const t = useTranslate();

  return (
    <section aria-labelledby="browse-jobs-by-category">
      <DiscoverySectionHeader
        title={t("home.discovery.categoriesTitle")}
        titleId="browse-jobs-by-category"
        actionLabel={t("home.discovery.categoriesAction")}
        actionHref={ROUTES.JOB_CATEGORIES}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:grid-cols-8">
        {JOB_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={{
              ...category,
              name: t(CATEGORY_NAME_KEYS[category.icon]),
              jobCount: category.jobCount
                ? translateJobCount(category.jobCount, t)
                : undefined,
              subtitle: category.subtitle
                ? t("home.discovery.categories.viewAllSubtitle")
                : undefined,
            }}
          />
        ))}
      </div>
    </section>
  );
}
