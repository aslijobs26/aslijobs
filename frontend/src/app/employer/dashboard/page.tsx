import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Employer Dashboard | AsliJobs",
  description: "AsliJobs employer dashboard",
};

export default function EmployerDashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Employer Dashboard
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Dashboard placeholder. Authentication will be connected in a later
          phase.
        </p>
        <Link
          href={ROUTES.HOME}
          className="mt-6 inline-flex text-sm font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
