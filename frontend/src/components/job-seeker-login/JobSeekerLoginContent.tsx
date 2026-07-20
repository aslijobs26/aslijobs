import { JobSeekerLoginForm } from "@/components/job-seeker-login/JobSeekerLoginForm";
import {
  JOB_SEEKER_LOGIN_REGISTER_LABEL,
  JOB_SEEKER_LOGIN_REGISTER_PROMPT,
} from "@/constants/job-seeker-login";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import type { ReactNode } from "react";

type JobSeekerLoginContentProps = {
  children: ReactNode;
};

export function JobSeekerLoginContent({ children }: JobSeekerLoginContentProps) {
  return (
    <div className="employer-register-layout employer-register-layout--login">
      {children}

      <section className="employer-register-form-section">
        <div className="employer-register-form-container">
          <p className="employer-register-login-prompt">
            {JOB_SEEKER_LOGIN_REGISTER_PROMPT}{" "}
            <Link
              href={ROUTES.JOB_SEEKER_REGISTER}
              className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {JOB_SEEKER_LOGIN_REGISTER_LABEL}
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
