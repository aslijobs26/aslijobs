import { EMPLOYER_REGISTER_LOGIN_PROMPT } from "@/constants/employer-register";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { EmployerRegisterForm } from "./EmployerRegisterForm";
import { EmployerRegisterPanel } from "./EmployerRegisterPanel";

export function EmployerRegisterContent() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface lg:h-dvh lg:flex-row lg:overflow-hidden">
      <EmployerRegisterPanel />

      <section className="relative flex min-h-0 flex-1 flex-col bg-surface lg:h-dvh lg:w-[61%] lg:overflow-hidden">
        <div className="mx-auto flex w-full max-w-[32.5rem] flex-1 flex-col px-5 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8 lg:min-h-0 lg:px-0 lg:pb-10 lg:pt-8">
          <p className="shrink-0 self-end text-sm text-muted">
            {EMPLOYER_REGISTER_LOGIN_PROMPT}{" "}
            <Link
              href={ROUTES.LOGIN}
              className="font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Login
            </Link>
          </p>

          <div className="flex min-h-0 flex-1 items-center justify-center">
            <EmployerRegisterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
