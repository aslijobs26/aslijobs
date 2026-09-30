"use client";

import { FOOTER_NAV_GROUPS } from "@/constants/footer-navigation";
import { COMPANY_NAME, SITE_NAME } from "@/constants/site";
import { useTranslate } from "@/i18n/translate";
import { Container } from "../Container";
import { FooterBrand } from "./FooterBrand";
import { FooterLinkColumn } from "./FooterLinkColumn";
import { FooterWhatsAppPanel } from "./FooterWhatsAppPanel";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslate();

  return (
    <footer
      data-site-footer
      className="relative min-w-0 overflow-x-clip bg-foreground text-surface mobile:hidden"
    >
      <Container className="py-8 sm:py-10 lg:py-12">
        <div className="grid min-w-0 grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4 xl:grid-cols-6 xl:gap-x-6 xl:gap-y-8">
          <div className="min-w-0 sm:col-span-2 lg:col-span-4 xl:col-span-1">
            <FooterBrand />
          </div>

          {FOOTER_NAV_GROUPS.map((group) => (
            <FooterLinkColumn key={group.id} group={group} />
          ))}

          <div className="min-w-0 sm:col-span-2 lg:col-span-4 xl:col-span-1">
            <FooterWhatsAppPanel />
          </div>
        </div>

        <div className="mt-8 border-t border-border/20 pt-5 text-center text-xs leading-relaxed text-primary-light sm:mt-10 sm:pt-6 sm:text-sm">
          <p className="text-balance break-words">
            © {currentYear} {SITE_NAME} | {t("footer.rights")} | {t("footer.poweredBy")}{" "}
            <span className="font-semibold text-primary">{COMPANY_NAME}</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
