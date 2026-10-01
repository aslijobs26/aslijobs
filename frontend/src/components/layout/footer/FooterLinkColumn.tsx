"use client";

import type { FooterNavGroup } from "@/types/footer";
import { useTranslate } from "@/i18n/translate";
import Link from "next/link";

type FooterLinkColumnProps = {
  group: FooterNavGroup;
};

function isExternalHref(href: string) {
  return href.startsWith("http");
}

export function FooterLinkColumn({ group }: FooterLinkColumnProps) {
  const t = useTranslate();
  const title = t(group.titleKey);

  return (
    <nav aria-label={title} className="min-w-0">
      <h3 className="text-sm font-bold text-balance text-surface">{title}</h3>

      <ul className="mt-3 space-y-2.5">
        {group.links.map((link) => {
          const isExternal = isExternalHref(link.href);
          const label = t(link.labelKey);

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
