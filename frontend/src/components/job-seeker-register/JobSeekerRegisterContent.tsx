"use client";

import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import Link from "next/link";
import type { ReactNode } from "react";
import { JobSeekerRegisterForm } from "./JobSeekerRegisterForm";

type JobSeekerRegisterContentProps = {
  children: ReactNode;
};

export function JobSeekerRegisterContent({
  children,
}: JobSeekerRegisterContentProps) {
  const t = useTranslate();

  return (
    <div className="employer-register-layout">
      {children}

      <section className="employer-register-form-section">
        <div className="employer-register-form-container">
          <p className="employer-register-login-prompt break-words">
            {t("auth.common.haveAccountPrompt")}{" "}
            <Link
              href={ROUTES.JOB_SEEKER_LOGIN}
              className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t("auth.jobSeekerRegister.loginLink")}
            </Link>
          </p>

          <div className="employer-register-form-body">
            <JobSeekerRegisterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
