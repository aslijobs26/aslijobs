import { ASLI_JOBS_BENEFITS } from "@/constants/asli-jobs-benefits";
import { BenefitCard } from "./BenefitCard";

export function WhyChooseSection() {
  return (
    <section aria-labelledby="why-choose-asli-jobs">
      <h2
        id="why-choose-asli-jobs"
        className="mb-4 text-center text-lg font-bold text-foreground sm:mb-5 sm:text-xl"
      >
        Why Choose AsliJobs?
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        {ASLI_JOBS_BENEFITS.map((benefit) => (
          <BenefitCard key={benefit.id} benefit={benefit} />
        ))}
      </div>
    </section>
  );
}
