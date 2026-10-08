"use client";

import { EmployerLoginForm } from "@/components/employer-login/EmployerLoginForm";
import { InAppBrowserHandoffGate } from "@/components/in-app-browser/InAppBrowserHandoff";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

type EmployerLoginContentProps = {
  children: ReactNode;
};

export function EmployerLoginContent({ children }: EmployerLoginContentProps) {
  const t = useTranslate();

  return (
    <div className="employer-register-layout employer-register-layout--login">
      {/* Mobile: branding first (top). Desktop: CSS order moves form left. */}
      {children}

      <section className="employer-register-form-section">
        <div className="employer-register-form-container">
          <InAppBrowserHandoffGate
            loadingFallback={
              <div className="employer-register-form-body">
                <p className="text-sm text-muted">
                  {t("auth.common.loadingLogin")}
                </p>
              </div>
            }
          >
            <p className="employer-register-login-prompt break-words">
              {t("auth.common.noAccountPrompt")}{" "}
              <Link
                href={ROUTES.EMPLOYER_REGISTER}
                className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {t("auth.common.register")}
              </Link>
            </p>

            <div className="employer-register-form-body">
              <Suspense
                fallback={
                  <p className="text-sm text-muted">
                    {t("auth.common.loadingLogin")}
                  </p>
                }
              >
                <EmployerLoginForm />
              </Suspense>
            </div>
          </InAppBrowserHandoffGate>
        </div>
      </section>
    </div>
  );
}
