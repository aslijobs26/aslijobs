import { EmployerLoginForm } from "@/components/employer-login/EmployerLoginForm";
import {
  EMPLOYER_LOGIN_REGISTER_LABEL,
  EMPLOYER_LOGIN_REGISTER_PROMPT,
} from "@/constants/employer-login";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

type EmployerLoginContentProps = {
  children: ReactNode;
};

export function EmployerLoginContent({ children }: EmployerLoginContentProps) {
  return (
    <div className="employer-register-layout employer-register-layout--login">
      {/* Mobile: branding first (top). Desktop: CSS order moves form left. */}
      {children}

      <section className="employer-register-form-section">
        <div className="employer-register-form-container">
          <p className="employer-register-login-prompt">
            {EMPLOYER_LOGIN_REGISTER_PROMPT}{" "}
            <Link
              href={ROUTES.EMPLOYER_REGISTER}
              className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {EMPLOYER_LOGIN_REGISTER_LABEL}
            </Link>
          </p>

          <div className="employer-register-form-body">
            <Suspense
              fallback={
                <p className="text-sm text-muted">Loading login…</p>
              }
            >
              <EmployerLoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
