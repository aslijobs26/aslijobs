import frameQuickJobPosting from "@/assets/employer-register/frame-quick-job-posting.png";
import frameVerifiedCandidates from "@/assets/employer-register/frame-verified-candidates.png";
import frameWhatsappFirstHiring from "@/assets/employer-register/frame-whatsapp-first-hiring.png";
import { cn } from "@/utils/cn";
import Image from "next/image";

/**
 * Collage layout matched to the Employer Register reference:
 * Verified (left) → WhatsApp (upper-right, front) → Quick Job (lower-center).
 */
const EMPLOYER_REGISTER_FRAMES = [
  {
    id: "verified-candidates",
    src: frameVerifiedCandidates,
    className: "absolute -left-[12%] top-[14%] z-20 w-[55%]",
  },
  {
    id: "whatsapp-first-hiring",
    src: frameWhatsappFirstHiring,
    className: "absolute left-[28%] top-0 z-30 w-[72%]",
  },
  {
    id: "quick-job-posting",
    src: frameQuickJobPosting,
    className: "absolute left-[14%] top-[56%] z-20 w-[52%]",
  },
] as const;

export function EmployerRegisterIllustration() {
  return (
    <div className="employer-register-illustration" aria-hidden="true">
      {EMPLOYER_REGISTER_FRAMES.map((frame) => (
        <Image
          key={frame.id}
          src={frame.src}
          alt=""
          className={cn("h-auto select-none", frame.className)}
          sizes="(max-width: 1024px) 80vw, 22rem"
          priority
        />
      ))}
    </div>
  );
}
