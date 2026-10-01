import type { MessageKey } from "@/i18n/translate";

export type FooterNavLink = {
  id: string;
  labelKey: MessageKey;
  href: string;
};

export type FooterNavGroup = {
  id: string;
  titleKey: MessageKey;
  links: FooterNavLink[];
};
