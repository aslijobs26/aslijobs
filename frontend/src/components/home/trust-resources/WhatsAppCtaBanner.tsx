import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import Link from "next/link";

export function WhatsAppCtaBanner() {
  const isExternal = WHATSAPP_JOIN_URL.startsWith("http");

  return (
    <section aria-labelledby="ready-to-find-your-next-job">
      <div className="flex flex-col gap-4 rounded-2xl bg-whatsapp-dark p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6 lg:p-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full border-[3px] border-whatsapp bg-surface sm:size-14">
            <WhatsAppIcon fill />
          </div>

          <div className="min-w-0">
            <h2
              id="ready-to-find-your-next-job"
              className="text-lg font-bold text-surface sm:text-xl"
            >
              Ready to find your next job?
            </h2>
            <p className="mt-1 text-sm text-primary-light sm:text-base">
              Join AsliJobs on WhatsApp now and get started in seconds.
            </p>
          </div>
        </div>

        <Link
          href={WHATSAPP_JOIN_URL}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-surface px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/60 sm:w-auto"
        >
          Join on WhatsApp
          <WhatsAppIcon className="text-base" />
        </Link>
      </div>
    </section>
  );
}
