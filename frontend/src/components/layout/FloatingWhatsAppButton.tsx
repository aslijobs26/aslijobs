"use client";

import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import {
  buildWhatsAppActionUrl,
  listWhatsAppFabActionIds,
  type WhatsAppFabActionId,
} from "@/constants/whatsapp-welcome-messages";
import { useWhatsAppFabAudience } from "@/hooks/useWhatsAppFabAudience";
import { useSiteLanguage } from "@/i18n/site-language";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import { cn } from "@/utils/cn";
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  HelpCircle,
  LoaderCircle,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentType } from "react";

type ActionIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

const ACTION_ICONS: Record<WhatsAppFabActionId, ActionIcon> = {
  find_job: Search,
  hire_staff: BriefcaseBusiness,
  find_jobs: Search,
  profile_jobs: Sparkles,
  application_status: ClipboardList,
  seeker_help: HelpCircle,
  post_job: BriefcaseBusiness,
  my_jobs: Building2,
  employer_applications: Users,
  employer_help: HelpCircle,
};

const ACTION_ICON_TONES: Record<WhatsAppFabActionId, string> = {
  find_job: "bg-primary/10 text-primary",
  hire_staff: "bg-pin-state/10 text-pin-state",
  find_jobs: "bg-primary/10 text-primary",
  profile_jobs: "bg-whatsapp/10 text-whatsapp",
  application_status: "bg-primary/10 text-primary",
  seeker_help: "bg-hero-bg text-muted",
  post_job: "bg-pin-state/10 text-pin-state",
  my_jobs: "bg-primary/10 text-primary",
  employer_applications: "bg-whatsapp/10 text-whatsapp",
  employer_help: "bg-hero-bg text-muted",
};

function actionMessageKey(
  actionId: WhatsAppFabActionId,
  field: "title" | "description" | "aria",
): MessageKey {
  return `whatsappFab.actions.${actionId}.${field}` as MessageKey;
}

export function FloatingWhatsAppButton() {
  const t = useTranslate();
  const siteLanguage = useSiteLanguage();
  const { status, actionAudience, retry } = useWhatsAppFabAudience();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        fabRef.current?.focus({ preventScroll: true });
      }
      return;
    }

    wasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const openWhatsApp = (actionId: WhatsAppFabActionId) => {
    if (!actionAudience) {
      return;
    }
    const allowed = listWhatsAppFabActionIds(actionAudience);
    if (!allowed.includes(actionId)) {
      return;
    }
    const href = buildWhatsAppActionUrl(actionId, siteLanguage.code);
    setOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const actionIds = actionAudience ? listWhatsAppFabActionIds(actionAudience) : [];

  const title =
    status === "loading"
      ? t("whatsappFab.loadingTitle")
      : status === "unknown"
        ? t("whatsappFab.unknownTitle")
        : t("whatsappFab.title");
  const subtitle =
    status === "loading"
      ? t("whatsappFab.loadingSubtitle")
      : status === "unknown"
        ? t("whatsappFab.unknownSubtitle")
        : t("whatsappFab.subtitle");

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("whatsappFab.openAria")}
        title={t("whatsappFab.openTitle")}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed z-50 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-white animate-whatsapp-fab transition-transform duration-200 ease-out hover:scale-105 hover:bg-whatsapp-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/50 focus-visible:ring-offset-2 active:scale-95 right-4 bottom-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] md:right-6 md:bottom-6 md:size-16"
      >
        <WhatsAppIcon className="text-[1.75rem] leading-none text-white md:text-[2rem]" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60]" role="presentation">
          <button
            type="button"
            aria-label={t("whatsappFab.closeAria")}
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px] sm:bg-foreground/20 sm:backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              tabIndex={-1}
              className={cn(
                "relative w-full max-w-[20.5rem] overflow-hidden rounded-2xl border border-border-subtle bg-surface outline-none sm:max-w-md",
                "px-3.5 pb-3.5 pt-3 shadow-[0_24px_64px_rgba(26,43,60,0.22)] sm:px-6 sm:pb-6 sm:pt-5",
                "ring-1 ring-black/5",
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:top-3 sm:right-3 sm:size-9"
                aria-label={t("whatsappFab.closeAria")}
              >
                <X className="size-3.5 sm:size-4" strokeWidth={2.25} aria-hidden="true" />
              </button>

              <div className="flex flex-col items-center px-0.5 pt-1 text-center sm:px-1 sm:pt-3">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-whatsapp/10 text-whatsapp ring-1 ring-whatsapp/20 sm:size-12">
                  {status === "loading" ? (
                    <LoaderCircle
                      className="size-4 animate-spin sm:size-6"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                  ) : (
                    <WhatsAppIcon className="text-[1.15rem] leading-none sm:text-[1.5rem]" />
                  )}
                </span>
                <h2
                  id={titleId}
                  className="mt-2 text-base font-bold tracking-tight text-foreground sm:mt-3 sm:text-xl"
                >
                  {title}
                </h2>
                <p
                  id={descriptionId}
                  className="mt-1 max-w-[18rem] text-xs leading-snug text-muted sm:mt-1.5 sm:max-w-[22rem] sm:text-sm sm:leading-relaxed"
                >
                  {subtitle}
                </p>
              </div>

              {status === "loading" ? (
                <div
                  className="mt-3 flex items-center justify-center gap-2 py-4 text-xs text-muted sm:mt-6 sm:py-6 sm:text-sm"
                  role="status"
                  aria-live="polite"
                >
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  <span>{t("whatsappFab.loadingSubtitle")}</span>
                </div>
              ) : null}

              {status === "unknown" ? (
                <div className="mt-3 flex flex-col gap-2 sm:mt-6 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-whatsapp px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/35 sm:rounded-2xl sm:px-4 sm:py-3"
                  >
                    {t("whatsappFab.retryLabel")}
                  </button>
                </div>
              ) : null}

              {status === "guest" ||
              status === "jobseeker" ||
              status === "employer" ? (
                <div className="mt-3 flex max-h-[min(52vh,22rem)] flex-col gap-2 overflow-y-auto sm:mt-6 sm:max-h-[min(60vh,28rem)] sm:gap-2.5">
                  {actionIds.map((actionId) => {
                    const Icon = ACTION_ICONS[actionId];
                    return (
                      <button
                        key={actionId}
                        type="button"
                        onClick={() => openWhatsApp(actionId)}
                        aria-label={t(actionMessageKey(actionId, "aria"))}
                        className="flex w-full items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/35 sm:items-start sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3.5"
                      >
                        <span
                          className={cn(
                            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg sm:mt-0.5 sm:size-10 sm:rounded-xl",
                            ACTION_ICON_TONES[actionId],
                          )}
                        >
                          <Icon
                            className="size-4 sm:size-5"
                            strokeWidth={2.25}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight text-foreground">
                            {t(actionMessageKey(actionId, "title"))}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-muted sm:text-sm sm:leading-relaxed">
                            {t(actionMessageKey(actionId, "description"))}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
