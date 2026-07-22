"use client";

import { ROUTES } from "@/constants/routes";
import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

type HeroEmployerPostJobLinkProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Landing-page "Post a Job" CTA only.
 * Authenticated employers go to Post Job; others go to Employer Login
 * (post-login redirect is always Employer Dashboard).
 */
export function HeroEmployerPostJobLink({
  className,
  children,
}: HeroEmployerPostJobLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (getEmployerAccessToken()) {
      return;
    }

    event.preventDefault();
    router.push(ROUTES.EMPLOYER_LOGIN);
  };

  return (
    <Link href={ROUTES.POST_JOB} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
