import { ROUTES } from "@/constants/routes";
import { redirect } from "next/navigation";

/** Legacy URL — Job Seeker Dashboard page removed; send users to Profile. */
export default function JobSeekerDashboardPage() {
  redirect(ROUTES.JOB_SEEKER_PROFILE);
}
