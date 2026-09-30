"use client";

import type { FooterNavGroup } from "@/types/footer";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import Link from "next/link";

type FooterLinkColumnProps = {
  group: FooterNavGroup;
};

const GROUP_KEYS: Record<string, MessageKey> = {
  "job-seekers": "footer.jobSeekers",
  employers: "footer.employers",
  resources: "footer.resources",
  support: "footer.support",
};

const LINK_KEYS: Record<string, MessageKey> = {
  "find-jobs": "footer.findJobs",
  "browse-by-city": "footer.browseByCity",
  "browse-by-state": "footer.browseByState",
  "job-categories": "footer.jobCategories",
  "job-seeker-guide": "footer.jobSeekerGuide",
  "post-a-job": "footer.postAJob",
  "employer-login": "footer.employerLogin",
  "pricing-plans": "footer.pricingPlans",
  "employer-guide": "footer.employerGuide",
  faqs: "footer.faqs",
  terms: "footer.terms",
  privacy: "footer.privacy",
  guidelines: "footer.guidelines",
  sitemap: "footer.sitemap",
  "help-center": "footer.helpCenter",
  "contact-us": "footer.contactUs",
  "whatsapp-support": "footer.whatsappSupport",
};

function isExternalHref(href: string) {
  return href.startsWith("http");
}

export function FooterLinkColumn({ group }: FooterLinkColumnProps) {
  const t = useTranslate();
  const title = GROUP_KEYS[group.id] ? t(GROUP_KEYS[group.id]) : group.title;

  return (
    <nav aria-label={title} className="min-w-0">
      <h3 className="text-sm font-bold text-balance text-surface">{title}</h3>

      <ul className="mt-3 space-y-2.5">
        {group.links.map((link) => {
          const isExternal = isExternalHref(link.href);
          const label = LINK_KEYS[link.id] ? t(LINK_KEYS[link.id]) : link.label;

          return (
            <li key={link.id} className="min-w-0">
              <Link
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="inline-block max-w-full break-words text-sm text-primary-light transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
