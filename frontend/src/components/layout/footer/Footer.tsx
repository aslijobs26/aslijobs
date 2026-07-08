import { FOOTER_NAV_GROUPS } from "@/constants/footer-navigation";
import { COMPANY_NAME, SITE_NAME } from "@/constants/site";
import { Container } from "../Container";
import { FooterBrand } from "./FooterBrand";
import { FooterLinkColumn } from "./FooterLinkColumn";
import { FooterWhatsAppPanel } from "./FooterWhatsAppPanel";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-surface">
      <Container className="py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))_minmax(0,1.35fr)] xl:gap-8">
          <div className="md:col-span-2 xl:col-span-1">
            <FooterBrand />
          </div>

          {FOOTER_NAV_GROUPS.map((group) => (
            <FooterLinkColumn key={group.id} group={group} />
          ))}

          <div className="md:col-span-2 xl:col-span-1">
            <FooterWhatsAppPanel />
          </div>
        </div>

        <div className="mt-10 border-t border-border/20 pt-6 text-center text-sm text-primary-light sm:mt-12">
          <p>
            © {currentYear} {SITE_NAME} | All rights reserved | Powered by{" "}
            <span className="font-semibold text-primary">{COMPANY_NAME}</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
