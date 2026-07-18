"use client";

import { EMPLOYER_REGISTER_LOGIN_PROMPT } from "@/constants/employer-register";
import { ROUTES } from "@/constants/routes";
import type {
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
  const [employerId, setEmployerId] = useState<string | null>(null);

  const navigateToPostJob = () => {
    router.push(ROUTES.POST_JOB);
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
                onContinue={(formData, accountType, nextEmployerId) => {
                  setEmployerId(nextEmployerId);

                  if (accountType === "individual") {
                    navigateToPostJob();
                    return;
                  }

                  setAccountFormSnapshot(formData);
                  setStep("company-profile");
                }}
              />
            ) : employerId ? (
              <EmployerRegisterCompanyProfileForm
                employerId={employerId}
                initialCompanyName={accountFormSnapshot?.companyName}
                initialWhatsappNumber={accountFormSnapshot?.whatsappNumber}
                initialEmailAddress={accountFormSnapshot?.emailAddress}
                onContinue={navigateToPostJob}
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
