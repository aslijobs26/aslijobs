"use client";

import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";

export function JobSearchWhatsAppBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
          <WhatsAppIcon className="text-xl text-white" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">
            Get new jobs on WhatsApp
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Receive matching openings and apply faster.
          </p>
        </div>
      </div>
      <a
        href={WHATSAPP_JOIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        Join Now
      </a>
    </div>
  );
}
