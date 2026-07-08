import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import { ExternalLink, QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const whatsappQrCodePath = process.env.NEXT_PUBLIC_WHATSAPP_QR_IMAGE;

export function FooterWhatsAppPanel() {
  const isExternal = WHATSAPP_JOIN_URL.startsWith("http");

  return (
    <aside
      aria-label="WhatsApp support"
      className="border-border/20 min-w-0 border-t pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
    >
      <h3 className="text-sm font-bold text-surface">Active on WhatsApp</h3>

      <p className="mt-2 max-w-xs whitespace-pre-line text-sm leading-relaxed text-primary-light">
        Chat with AsliJobs Bot{"\n"}Click below to open{"\n"}in WhatsApp Web
      </p>

      <Link
        href={WHATSAPP_JOIN_URL}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-semibold text-surface transition-colors hover:bg-whatsapp-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/40 sm:w-auto lg:h-9 lg:gap-1.5 lg:px-3 lg:text-xs lg:whitespace-nowrap"
      >
        <WhatsAppIcon className="shrink-0 text-base text-surface lg:text-sm" />
        Open in WhatsApp
        <ExternalLink
          className="size-4 shrink-0 text-nav lg:size-3.5"
          strokeWidth={2}
          aria-hidden="true"
        />
      </Link>

      <div className="mt-5 flex items-start gap-3 lg:items-center">
        <div className="flex min-w-0 items-center gap-2 text-sm text-primary-light lg:shrink-0 lg:whitespace-nowrap">
          <QrCode className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span>Scan QR to open</span>
        </div>

        {whatsappQrCodePath ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface p-1">
            <Image
              src={whatsappQrCodePath}
              alt="WhatsApp QR code for AsliJobs"
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
