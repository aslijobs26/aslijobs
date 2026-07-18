import { ROUTES } from "@/constants/routes";
import { redirect } from "next/navigation";

/** Legacy `/login` path — redirects to Employer Login. */
export default function LoginRedirectPage() {
  redirect(ROUTES.EMPLOYER_LOGIN);
}
