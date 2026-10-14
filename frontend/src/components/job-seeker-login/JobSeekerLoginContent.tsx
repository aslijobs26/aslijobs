"use client";

import { JobSeekerLoginForm } from "@/components/job-seeker-login/JobSeekerLoginForm";
import { NavbarLanguageButton } from "@/components/layout/NavbarLanguageButton";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import Link from "next/link";
import type { ReactNode } from "react";

type JobSeekerLoginContentProps = {
  children: ReactNode;
};

export function JobSeekerLoginContent({ children }: JobSeekerLoginContentProps) {
  const t = useTranslate();

  return (
    <div className="employer-register-layout employer-register-layout--login">
      {children}

      <section className="employer-register-form-section">
        <div className="employer-register-form-container">
          <div className="mb-4 flex justify-end">
            <NavbarLanguageButton />
          </div>
          <p className="employer-register-login-prompt break-words">
            {t("auth.common.noAccountPrompt")}{" "}
            <Link
              href={ROUTES.JOB_SEEKER_REGISTER}
              className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t("auth.common.register")}
            </Link>
          </p>

          <div className="employer-register-form-body">
            <JobSeekerLoginForm />
          </div>
        </div>
      </section>
    </div>
  );
}
