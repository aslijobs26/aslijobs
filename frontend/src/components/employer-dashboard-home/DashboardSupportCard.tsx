"use client";

import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import { EMPLOYER_DASHBOARD_SUPPORT_PHONE } from "@/constants/employer-dashboard-home";
import { ROUTES } from "@/constants/routes";
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
    "flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function DashboardSupportCard() {
  const phoneHref = EMPLOYER_DASHBOARD_SUPPORT_PHONE
    ? `tel:${EMPLOYER_DASHBOARD_SUPPORT_PHONE.replace(/\s+/g, "")}`
    : ROUTES.CONTACT;
  const phoneLabel = EMPLOYER_DASHBOARD_SUPPORT_PHONE
    ? `Call Support (${EMPLOYER_DASHBOARD_SUPPORT_PHONE})`
    : "Call Support";
  const whatsappExternal = WHATSAPP_JOIN_URL.startsWith("http");

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary-light text-primary">
          <Headphones className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-foreground">Need Help?</h2>
          <p className="text-xs text-muted">We are here to support your hiring</p>
        </div>
      </div>

      <ul className="mt-3 space-y-0.5">
        <li>
          <SupportItem
            href={ROUTES.EMPLOYER_HELP_CENTER}
            icon={
              <MessageCircle
                className="size-4 shrink-0 text-benefit-verified-icon"
                aria-hidden="true"
              />
            }
            label="Live Chat"
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
            label="WhatsApp Support"
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
            label="Help Center"
          />
        </li>
      </ul>
    </section>
  );
}
