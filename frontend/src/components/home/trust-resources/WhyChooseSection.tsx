"use client";

import { BENEFIT_KEYS } from "@/components/home/home-i18n";
import { ASLI_JOBS_BENEFITS } from "@/constants/asli-jobs-benefits";
import { useTranslate } from "@/i18n/translate";
import { BenefitCard } from "./BenefitCard";

export function WhyChooseSection() {
  const t = useTranslate();

  return (
    <section aria-labelledby="why-choose-asli-jobs">
      <h2
        id="why-choose-asli-jobs"
        className="mb-4 text-balance break-words text-center text-lg font-bold text-foreground sm:mb-5 sm:text-xl"
      >
        {t("home.trust.whyTitle")}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        {ASLI_JOBS_BENEFITS.map((benefit) => (
          <BenefitCard
            key={benefit.id}
            benefit={{
              ...benefit,
              title: t(BENEFIT_KEYS[benefit.icon].title),
              description: t(BENEFIT_KEYS[benefit.icon].description),
            }}
          />
        ))}
      </div>
    </section>
  );
}
