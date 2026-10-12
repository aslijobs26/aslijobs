"use client";

import { useTranslate } from "@/i18n/translate";
import {
  closeProfileCompletionDialog,
  registerProfileCompletionDialog,
  type ProfileCompletionDialogRequest,
} from "@/utils/profile-completion-dialog";
import { useEffect, useState } from "react";

export function ProfileCompletionDialogHost() {
  const t = useTranslate();
  const [request, setRequest] = useState<ProfileCompletionDialogRequest | null>(
    null,
  );

  useEffect(() => {
    registerProfileCompletionDialog(setRequest);
    return () => {
      registerProfileCompletionDialog(null);
    };
  }, []);

  if (!request) {
    return null;
  }

  const closeDialog = () => {
    request.onClose();
    closeProfileCompletionDialog();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-completion-dialog-title"
        aria-describedby="profile-completion-dialog-message"
        className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-5 shadow-xl sm:p-6"
      >
        <h2
          id="profile-completion-dialog-title"
          className="text-lg font-bold text-foreground"
        >
          {t("seeker.applyProfileGate.title")}
        </h2>
        <p
          id="profile-completion-dialog-message"
          className="mt-2 text-sm leading-relaxed text-muted"
        >
          {t("seeker.applyProfileGate.body")}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={closeDialog}
          >
            {t("seeker.applyProfileGate.close")}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => {
              closeProfileCompletionDialog();
              request.onCompleteProfile();
            }}
          >
            {t("seeker.applyProfileGate.complete")}
          </button>
        </div>
      </div>
    </div>
  );
}
