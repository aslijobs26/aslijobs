"use client";

import { ROUTES } from "@/constants/routes";
import { buildEmployerLoginHref } from "@/utils/safe-return-url";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export type HireAssistAccessRole = "employer" | "jobseeker" | "guest";

type HireAssistAccessModalProps = {
  role: Exclude<HireAssistAccessRole, "employer">;
  onClose: () => void;
};

export function HireAssistAccessModal({
  role,
  onClose,
}: HireAssistAccessModalProps) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  const isGuest = role === "guest";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close Hire Assist access message"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border-subtle bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              Employer Access Required
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
              {isGuest
                ? "This feature is available only for employers. Please register or log in with your employer account to continue."
                : "Hire Assist is available exclusively for employers. Please log in with an employer account to access this feature."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          {isGuest ? (
            <>
              <button
                type="button"
                onClick={() => router.push(buildEmployerLoginHref(ROUTES.HIRE_ASSIST))}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => router.push(ROUTES.EMPLOYER_REGISTER)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-assist-button px-4 text-sm font-semibold text-surface transition-colors hover:bg-assist-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-assist-button/40"
              >
                Register as Employer
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-assist-button px-4 text-sm font-semibold text-surface transition-colors hover:bg-assist-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-assist-button/40"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
