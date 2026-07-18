import { EmployerLoginContent } from "@/components/employer-login/EmployerLoginContent";
import { EmployerRegisterPanel } from "@/components/employer-register/EmployerRegisterPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer Login | AsliJobs",
  description: "Login to your AsliJobs employer account using WhatsApp",
};

export default function EmployerLoginPage() {
  return (
    <main>
      <EmployerLoginContent>
        <EmployerRegisterPanel />
      </EmployerLoginContent>
    </main>
  );
}
