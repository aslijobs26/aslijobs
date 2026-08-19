"use client";

import { HeroEmployerConfirmModal } from "@/components/home/hero/HeroEmployerConfirmModal";
import { ROUTES } from "@/constants/routes";
import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type MouseEvent, type ReactNode } from "react";

type HeroEmployerPostJobLinkProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Landing-page "Post a Job" CTA only.
 * Authenticated employers go to Post Job.
 * Everyone else is asked to confirm they are an employer, then sent to
 * Employer Login (post-login redirect is always Employer Dashboard).
 */
export function HeroEmployerPostJobLink({
  className,
  children,
}: HeroEmployerPostJobLinkProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const closeConfirm = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

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
    setIsConfirmOpen(true);
  };

  const handleContinueAsEmployer = () => {
    setIsConfirmOpen(false);
    router.push(ROUTES.EMPLOYER_LOGIN);
  };

  return (
    <>
      <Link
        href={ROUTES.POST_JOB}
        className={className}
        aria-haspopup="dialog"
        aria-expanded={isConfirmOpen}
        onClick={handleClick}
      >
        {children}
      </Link>

      {isConfirmOpen ? (
        <HeroEmployerConfirmModal
          onClose={closeConfirm}
          onContinue={handleContinueAsEmployer}
        />
      ) : null}
    </>
  );
}
