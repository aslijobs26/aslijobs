import { EMPLOYER_REGISTER_LOGIN_PROMPT } from "@/constants/employer-register";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { EmployerRegisterForm } from "./EmployerRegisterForm";
import { EmployerRegisterPanel } from "./EmployerRegisterPanel";

export function EmployerRegisterContent() {
  return (
    <div className="employer-register-layout">
      <EmployerRegisterPanel />

      <section className="employer-register-form-section">
        <p className="employer-register-login-prompt">
          {EMPLOYER_REGISTER_LOGIN_PROMPT}{" "}
          <Link
            href={ROUTES.LOGIN}
            className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Login
          </Link>
        </p>

        <div className="employer-register-form-container">
          <div className="employer-register-form-body">
            <EmployerRegisterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
