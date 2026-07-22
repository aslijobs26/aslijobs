"use client";

import { EMPLOYER_REGISTER_LOGIN_PROMPT } from "@/constants/employer-register";
import { ROUTES } from "@/constants/routes";
import type {
  EmployerRegisterAccountType,
  EmployerRegisterFormData,
  EmployerRegisterStep,
} from "@/types/employer-register";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { EmployerRegisterCompanyProfileForm } from "./EmployerRegisterCompanyProfileForm";
import { EmployerRegisterForm } from "./EmployerRegisterForm";

type EmployerRegisterContentProps = {
  children: ReactNode;
};

export function EmployerRegisterContent({
  children,
}: EmployerRegisterContentProps) {
  const router = useRouter();
  const [step, setStep] = useState<EmployerRegisterStep>("account");
  const [accountFormSnapshot, setAccountFormSnapshot] =
    useState<EmployerRegisterFormData | null>(null);
  const [accountType, setAccountType] =
    useState<EmployerRegisterAccountType>("company");
  const [employerId, setEmployerId] = useState<string | null>(null);

  const navigateToDashboard = () => {
    router.push(ROUTES.EMPLOYER_DASHBOARD);
  };

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
              href={ROUTES.EMPLOYER_LOGIN}
              className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Login
            </Link>
          </p>

          <div className="employer-register-form-body">
            {step === "account" ? (
              <EmployerRegisterForm
                onContinue={(formData, nextAccountType, nextEmployerId) => {
                  setEmployerId(nextEmployerId);
                  setAccountType(nextAccountType);

                  if (nextAccountType === "individual") {
                    navigateToDashboard();
                    return;
                  }

                  setAccountFormSnapshot(formData);
                  setStep("company-profile");
                }}
              />
            ) : employerId ? (
              <EmployerRegisterCompanyProfileForm
                employerId={employerId}
                accountType={accountType === "consultancy" ? "consultancy" : "company"}
                initialCompanyName={accountFormSnapshot?.companyName}
                onContinue={navigateToDashboard}
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
