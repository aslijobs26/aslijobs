import testimonialCard from "@/assets/employer-register/testimonial-card.png";
import { EMPLOYER_REGISTER_TESTIMONIAL } from "@/constants/employer-register";
import { cn } from "@/utils/cn";
import Image from "next/image";

export function EmployerRegisterTestimonial() {
  const { activeDotIndex, totalDots } = EMPLOYER_REGISTER_TESTIMONIAL;

  return (
    <div className="w-full space-y-3">
      <Image
        src={testimonialCard}
        alt="Finding reliable site workers used to take weeks. With AsliJobs, we hired verified candidates quickly, saving both time and effort. Priya Reddy, Talent Acquisition Lead."
        className="h-auto w-full"
        sizes="(max-width: 1024px) 90vw, 28rem"
        priority
      />

      <div
        className="flex items-center justify-center gap-2 pt-0.5"
        role="tablist"
        aria-label="Testimonial slides"
      >
        {Array.from({ length: totalDots }, (_, index) => (
          <span
            key={index}
            role="presentation"
            className={cn(
              "size-1.5 rounded-full transition-colors",
              index === activeDotIndex ? "bg-surface" : "bg-surface/35",
            )}
          />
        ))}
      </div>
    </div>
  );
}
