"use client";

import { EmployerVerificationUnderReviewModal } from "@/components/post-job/EmployerVerificationUnderReviewModal";
import { ROUTES } from "@/constants/routes";
import { usePostJobAccessGate } from "@/hooks/usePostJobAccessGate";
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

type EmployerPostJobLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: ComponentProps<typeof Link>["href"];
};

/** Post Job link that opens the verification-under-review modal instead of the form when required. */
export function EmployerPostJobLink({
  href = ROUTES.POST_JOB,
  onClick,
  ...linkProps
}: EmployerPostJobLinkProps) {
  const { isUnderReviewModalOpen, closeUnderReviewModal, handlePostJobClick } =
    usePostJobAccessGate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    handlePostJobClick(event);
  };

  return (
    <>
      <Link href={href} onClick={handleClick} {...linkProps} />
      {isUnderReviewModalOpen ? (
        <EmployerVerificationUnderReviewModal onClose={closeUnderReviewModal} />
      ) : null}
    </>
  );
}
