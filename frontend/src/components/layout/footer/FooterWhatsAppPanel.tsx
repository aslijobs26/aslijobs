"use client";

import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { buildWhatsAppWelcomeUrl } from "@/constants/whatsapp-welcome-messages";
import { useSiteLanguage } from "@/i18n/site-language";
import { useTranslate } from "@/i18n/translate";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export function FooterWhatsAppPanel() {
  const t = useTranslate();
  const siteLanguage = useSiteLanguage();
  const whatsappHref = buildWhatsAppWelcomeUrl("seeker", siteLanguage.code);

  return (
    <aside
      aria-label={t("footer.whatsappSupport")}
      className="min-w-0 border-t border-border/20 pt-6 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 xl:pl-6"
    >
      <h3 className="text-sm font-bold text-balance text-surface">{t("footer.whatsappTitle")}</h3>

      <p className="mt-2 max-w-xs text-sm leading-relaxed text-pretty text-primary-light">
        {t("footer.whatsappBody")}
      </p>

      <Link
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 text-center text-sm font-semibold text-surface transition-colors hover:bg-whatsapp-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/40 sm:w-auto sm:min-w-[12.5rem] xl:h-auto xl:min-h-9 xl:min-w-0 xl:gap-1.5 xl:px-3 xl:py-2 xl:text-xs"
      >
        <WhatsAppIcon className="shrink-0 text-base text-surface xl:text-sm" />
        <span className="min-w-0 break-words">{t("footer.openWhatsapp")}</span>
        <ExternalLink
          className="size-4 shrink-0 text-nav xl:size-3.5"
          strokeWidth={2}
          aria-hidden="true"
        />
      </Link>
    </aside>
  );
}
