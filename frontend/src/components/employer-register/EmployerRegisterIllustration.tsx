import frameQuickJobPosting from "@/assets/employer-register/frame-quick-job-posting.png";
import frameVerifiedCandidates from "@/assets/employer-register/frame-verified-candidates.png";
import frameWhatsappFirstHiring from "@/assets/employer-register/frame-whatsapp-first-hiring.png";
import { cn } from "@/utils/cn";
import Image from "next/image";

/**
 * Collage layout matched to the Employer Register reference:
 * Verified (left) → WhatsApp (upper-right, front) → Quick Job (lower-center).
 * Positions keep the group optically centered in the illustration frame.
 */
const EMPLOYER_REGISTER_FRAMES = [
  {
    id: "verified-candidates",
    src: frameVerifiedCandidates,
    className: "absolute -left-[8%] top-[16%] z-20 w-[52%]",
  },
  {
    id: "whatsapp-first-hiring",
    src: frameWhatsappFirstHiring,
    className: "absolute left-[30%] top-0 z-30 w-[68%]",
  },
  {
    id: "quick-job-posting",
    src: frameQuickJobPosting,
    className: "absolute left-[18%] top-[56%] z-20 w-[50%]",
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
