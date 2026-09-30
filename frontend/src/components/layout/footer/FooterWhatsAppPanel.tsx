"use client";

import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { WHATSAPP_CONTACT_URL } from "@/constants/cta";
import { useTranslate } from "@/i18n/translate";
import { ExternalLink, QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const whatsappQrCodePath = process.env.NEXT_PUBLIC_WHATSAPP_QR_IMAGE;

export function FooterWhatsAppPanel() {
  const t = useTranslate();

  return (
    <aside
      aria-label={t("footer.whatsappSupport")}
      className="min-w-0 border-t border-border/20 pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"
    >
      <h3 className="text-sm font-bold text-balance text-surface">{t("footer.whatsappTitle")}</h3>

      <p className="mt-2 max-w-xs text-sm leading-relaxed text-pretty text-primary-light">
        {t("footer.whatsappBody")}
      </p>

      <Link
        href={WHATSAPP_CONTACT_URL}
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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-primary-light">
          <QrCode className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span className="break-words">{t("footer.scanQr")}</span>
        </div>

        {whatsappQrCodePath ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface p-1">
            <Image
              src={whatsappQrCodePath}
              alt={t("footer.qrAlt")}
              width={80}
              height={80}
              className="size-full object-contain"
            />
          </div>
        ) : (
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-border/30 bg-surface/10"
            aria-hidden="true"
          >
            <QrCode className="size-8 text-primary-light" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </aside>
  );
}
