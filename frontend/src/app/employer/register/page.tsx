import { EmployerRegisterContent } from "@/components/employer-register/EmployerRegisterContent";
import { EmployerRegisterPanel } from "@/components/employer-register/EmployerRegisterPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Employer Account | AsliJobs",
  description: "Register as an employer on AsliJobs",
};

export default function EmployerRegisterPage() {
  return (
    <main>
      <EmployerRegisterContent>
        <EmployerRegisterPanel />
      </EmployerRegisterContent>
    </main>
  );
}
