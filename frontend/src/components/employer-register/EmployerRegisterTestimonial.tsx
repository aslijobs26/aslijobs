import testimonialCard from "@/assets/employer-register/testimonial-card.png";
import { EMPLOYER_REGISTER_TESTIMONIAL } from "@/constants/employer-register";
import { cn } from "@/utils/cn";
import Image from "next/image";

export function EmployerRegisterTestimonial() {
  const { activeDotIndex, totalDots } = EMPLOYER_REGISTER_TESTIMONIAL;

  return (
    <div className="employer-register-testimonial">
      <Image
        src={testimonialCard}
        alt="Finding reliable site workers used to take weeks. With AsliJobs, we hired verified candidates quickly, saving both time and effort. Priya Reddy, Talent Acquisition Lead."
        className="employer-register-testimonial-card"
        sizes="(max-width: 640px) 88vw, (max-width: 1024px) 90vw, 30vw"
        priority
      />

      <div
        className="employer-register-testimonial-dots"
        role="tablist"
        aria-label="Testimonial slides"
      >
        {Array.from({ length: totalDots }, (_, index) => (
          <span
            key={index}
            role="presentation"
            className={cn(
              "employer-register-testimonial-dot transition-colors",
              index === activeDotIndex ? "bg-surface" : "bg-surface/35",
            )}
          />
        ))}
      </div>
    </div>
  );
}
