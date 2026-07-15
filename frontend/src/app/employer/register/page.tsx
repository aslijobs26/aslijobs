import { EmployerRegisterContent } from "@/components/employer-register/EmployerRegisterContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Employer Account | AsliJobs",
  description: "Register as an employer on AsliJobs",
};

export default function EmployerRegisterPage() {
  return (
    <main>
      <EmployerRegisterContent />
    </main>
  );
}
