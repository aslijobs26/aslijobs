"use client";

import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import { EMPLOYER_DASHBOARD_SUPPORT_PHONE } from "@/constants/employer-dashboard-home";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import {
  BookOpen,
  Headphones,
  MessageCircle,
  Phone,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function SupportItem({
  href,
  icon,
  label,
  external = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  external?: boolean;
}) {
  const className =
    "flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-11 sm:gap-3 sm:px-2.5 sm:text-sm";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {icon}
        <span className="min-w-0 break-words">{label}</span>
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {icon}
      <span className="min-w-0 break-words">{label}</span>
    </Link>
  );
}

export function DashboardSupportCard() {
  const t = useTranslate();
  const phoneHref = EMPLOYER_DASHBOARD_SUPPORT_PHONE
    ? `tel:${EMPLOYER_DASHBOARD_SUPPORT_PHONE.replace(/\s+/g, "")}`
    : ROUTES.CONTACT;
  const phoneLabel = EMPLOYER_DASHBOARD_SUPPORT_PHONE
    ? `${t("employer.dashboard.callSupport")} (${EMPLOYER_DASHBOARD_SUPPORT_PHONE})`
    : t("employer.dashboard.callSupport");
  const whatsappExternal = WHATSAPP_JOIN_URL.startsWith("http");

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-light text-primary sm:size-9">
          <Headphones className="size-3.5 sm:size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xs font-bold text-foreground sm:text-sm">
            {t("employer.shell.helpTitle")}
          </h2>
          <p className="break-words text-[0.6875rem] text-muted sm:text-xs">
            {t("employer.dashboard.supportSubtitle")}
          </p>
        </div>
      </div>

      <ul className="mt-2 space-y-0.5 sm:mt-3">
        <li>
          <SupportItem
            href={ROUTES.EMPLOYER_HELP_CENTER}
            icon={
              <MessageCircle
                className="size-4 shrink-0 text-benefit-verified-icon"
                aria-hidden="true"
              />
            }
            label={t("employer.dashboard.liveChat")}
          />
        </li>
        <li>
          <SupportItem
            href={WHATSAPP_JOIN_URL}
            external={whatsappExternal}
            icon={
              <MessageCircle
                className="size-4 shrink-0 text-benefit-whatsapp-icon"
                aria-hidden="true"
              />
            }
            label={t("footer.whatsappSupport")}
          />
        </li>
        <li>
          <SupportItem
            href={phoneHref}
            external={Boolean(EMPLOYER_DASHBOARD_SUPPORT_PHONE)}
            icon={
              <Phone
                className="size-4 shrink-0 text-resource-interview-icon"
                aria-hidden="true"
              />
            }
            label={phoneLabel}
          />
        </li>
        <li>
          <SupportItem
            href={ROUTES.EMPLOYER_HELP_CENTER}
            icon={
              <BookOpen
                className="size-4 shrink-0 text-benefit-languages-icon"
                aria-hidden="true"
              />
            }
            label={t("employer.shell.helpCenter")}
          />
        </li>
      </ul>
    </section>
  );
}
