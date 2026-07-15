import frameQuickJobPosting from "@/assets/employer-register/frame-quick-job-posting.png";
import frameVerifiedCandidates from "@/assets/employer-register/frame-verified-candidates.png";
import frameWhatsappFirstHiring from "@/assets/employer-register/frame-whatsapp-first-hiring.png";
import { cn } from "@/utils/cn";
import Image from "next/image";

/**
 * Frame layout matches Figma artboard 438.68 × 304.82.
 * Positions and widths are percentage-based for proportional scaling.
 */
const EMPLOYER_REGISTER_FRAMES = [
  {
    id: "verified-candidates",
    src: frameVerifiedCandidates,
    className: "absolute -left-[8%] top-[15%] z-20 w-[53.8%]",
  },
  {
    id: "whatsapp-first-hiring",
    src: frameWhatsappFirstHiring,
    className: "absolute left-[27.4%] top-0 z-30 w-[69.1%]",
  },
  {
    id: "quick-job-posting",
    src: frameQuickJobPosting,
    className: "absolute left-[17.1%] top-[56%] z-20 w-[50.4%]",
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
          className={cn("h-auto w-full select-none", frame.className)}
          sizes="(max-width: 1024px) 90cqi, 35vw"
          priority
        />
      ))}
    </div>
  );
}
