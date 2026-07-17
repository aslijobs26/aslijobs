"use client";

import { EMPLOYER_REGISTER_LOGIN_PROMPT } from "@/constants/employer-register";
import { ROUTES } from "@/constants/routes";
import type {
  EmployerRegisterFormData,
  EmployerRegisterStep,
} from "@/types/employer-register";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { EmployerRegisterCompanyProfileForm } from "./EmployerRegisterCompanyProfileForm";
import { EmployerRegisterForm } from "./EmployerRegisterForm";

type EmployerRegisterContentProps = {
  children: ReactNode;
};

export function EmployerRegisterContent({
  children,
}: EmployerRegisterContentProps) {
  const [step, setStep] = useState<EmployerRegisterStep>("account");
  const [accountFormSnapshot, setAccountFormSnapshot] =
    useState<EmployerRegisterFormData | null>(null);

  return (
    <div
      className={cn(
        "employer-register-layout",
        step === "company-profile" &&
          "employer-register-layout--company-profile",
      )}
    >
      {children}

      <section className="employer-register-form-section">
        <div className="employer-register-form-container">
          <p className="employer-register-login-prompt">
            {EMPLOYER_REGISTER_LOGIN_PROMPT}{" "}
            <Link
              href={ROUTES.LOGIN}
              className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Login
            </Link>
          </p>

          <div className="employer-register-form-body">
            {step === "account" ? (
              <EmployerRegisterForm
                onContinue={(formData) => {
                  setAccountFormSnapshot(formData);
                  setStep("company-profile");
                }}
              />
            ) : (
              <EmployerRegisterCompanyProfileForm
                initialCompanyName={accountFormSnapshot?.companyName}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
