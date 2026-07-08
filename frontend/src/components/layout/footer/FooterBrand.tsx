import asliLogo from "@/assets/AsliLogo.svg";

import {

  COMPANY_NAME,

  FOOTER_BRAND_DESCRIPTION,

} from "@/constants/site";

import { ROUTES } from "@/constants/routes";

import Image from "next/image";

import Link from "next/link";

import { FooterSocialLinks } from "./FooterSocialLinks";



const companyWebsiteUrl = process.env.NEXT_PUBLIC_COMPANY_URL;



export function FooterBrand() {

  return (

    <div className="min-w-0">

      <Link
        href={ROUTES.HOME}
        aria-label="AsliJobs home"
        className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Image
          src={asliLogo}
          alt=""
          width={213}
          height={70}
          className="h-12 w-auto sm:h-[52px] lg:h-[60px]"
          aria-hidden
        />
      </Link>



      <p className="mt-3 max-w-xs whitespace-pre-line text-sm leading-relaxed text-primary-light">

        {FOOTER_BRAND_DESCRIPTION}

      </p>



      <div className="mt-4 text-sm text-primary-light">

        <p>A product of</p>

        {companyWebsiteUrl ? (

          <a

            href={companyWebsiteUrl}

            target="_blank"

            rel="noopener noreferrer"

            className="mt-0.5 inline-block whitespace-nowrap font-semibold text-primary transition-colors hover:text-primary-light focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"

          >

            {COMPANY_NAME}

          </a>

        ) : (

          <p className="mt-0.5 whitespace-nowrap font-semibold text-primary">

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


