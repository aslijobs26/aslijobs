import type { FooterNavGroup } from "@/types/footer";
import Link from "next/link";

type FooterLinkColumnProps = {
  group: FooterNavGroup;
};

function isExternalHref(href: string) {
  return href.startsWith("http");
}

export function FooterLinkColumn({ group }: FooterLinkColumnProps) {
  return (
    <nav aria-label={group.title}>
      <h3 className="text-sm font-bold text-surface">{group.title}</h3>

      <ul className="mt-3 space-y-2.5">
        {group.links.map((link) => {
          const isExternal = isExternalHref(link.href);

          return (
            <li key={link.id}>
              <Link
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-sm text-primary-light transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
