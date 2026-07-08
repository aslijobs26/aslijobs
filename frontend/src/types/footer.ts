export type FooterNavLink = {
  id: string;
  label: string;
  href: string;
};

export type FooterNavGroup = {
  id: string;
  title: string;
  links: FooterNavLink[];
};
