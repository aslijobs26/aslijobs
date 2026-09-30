"use client";

import asliLogo from "@/assets/AsliLogo.svg";
import { COMPANY_NAME } from "@/constants/site";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import Image from "next/image";
import Link from "next/link";
import { FooterSocialLinks } from "./FooterSocialLinks";

const companyWebsiteUrl = process.env.NEXT_PUBLIC_COMPANY_URL;

export function FooterBrand() {
  const t = useTranslate();

  return (
    <div className="min-w-0">
      <Link
        href={ROUTES.HOME}
        aria-label={t("navbar.homeAria")}
        className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Image
          src={asliLogo}
          alt=""
          width={213}
          height={70}
          className="h-10 w-auto sm:h-12 lg:h-[52px] xl:h-[60px]"
          aria-hidden
        />
      </Link>

      <p className="mt-3 max-w-xs text-sm leading-relaxed text-pretty text-primary-light">
        {t("footer.description")}
      </p>

      <div className="mt-4 text-sm text-primary-light">
        <p>{t("footer.productOf")}</p>
        {companyWebsiteUrl ? (
          <a
            href={companyWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-block max-w-full break-words font-semibold text-primary transition-colors hover:text-primary-light focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {COMPANY_NAME}
          </a>
        ) : (
          <p className="mt-0.5 max-w-full break-words font-semibold text-primary">
            {COMPANY_NAME}
          </p>
        )}
      </div>

      <div className="mt-5">
        <FooterSocialLinks />
      </div>
    </div>
  );
}
