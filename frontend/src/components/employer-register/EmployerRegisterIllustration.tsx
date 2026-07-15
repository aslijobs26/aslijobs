import frameQuickJobPosting from "@/assets/employer-register/frame-quick-job-posting.png";
import frameVerifiedCandidates from "@/assets/employer-register/frame-verified-candidates.png";
import frameWhatsappFirstHiring from "@/assets/employer-register/frame-whatsapp-first-hiring.png";
import { cn } from "@/utils/cn";
import Image from "next/image";

/**
 * Frame positions match the Employer Register reference collage:
 * - Verified Candidates: mid-left with orange accent
 * - WhatsApp-First Hiring: upper-right with purple accent (front)
 * - Quick Job Posting: lower-center with blue accent
 */
const EMPLOYER_REGISTER_FRAMES = [
  {
    id: "verified-candidates",
    src: frameVerifiedCandidates,
    className: "absolute left-0 top-[22%] z-20 w-[56%] max-w-[13.25rem]",
  },
  {
    id: "whatsapp-first-hiring",
    src: frameWhatsappFirstHiring,
    className: "absolute left-[30%] top-0 z-30 w-[70%] max-w-[16.5rem]",
  },
  {
    id: "quick-job-posting",
    src: frameQuickJobPosting,
    className: "absolute left-[18%] top-[52%] z-20 w-[52%] max-w-[12.5rem]",
  },
] as const;

export function EmployerRegisterIllustration() {
  return (
    <div
      className="relative mx-auto aspect-[340/280] w-full max-w-[21rem] sm:max-w-[22.5rem]"
      aria-hidden="true"
    >
      {EMPLOYER_REGISTER_FRAMES.map((frame) => (
        <Image
          key={frame.id}
          src={frame.src}
          alt=""
          className={cn("h-auto select-none", frame.className)}
          sizes="(max-width: 1024px) 55vw, 17rem"
          priority
        />
      ))}
    </div>
  );
}
