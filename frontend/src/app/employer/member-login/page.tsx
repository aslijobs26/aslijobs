import { ROUTES } from "@/constants/routes";
import { redirect } from "next/navigation";

/** @deprecated Prefer /team-member/login */
export default function EmployerMemberLoginRedirectPage() {
  redirect(ROUTES.TEAM_MEMBER_LOGIN);
}
