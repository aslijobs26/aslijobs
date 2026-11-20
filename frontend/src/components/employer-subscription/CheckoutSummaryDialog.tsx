"use client";

import type { useTranslate } from "@/i18n/translate";
import type { SubscriptionPlan } from "@/types/subscription";
import { cn } from "@/utils/cn";
import { formatInr } from "@/utils/subscription-upgrade";
import { Check, Loader2, Lock, ReceiptText, ShieldCheck, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type Translate = ReturnType<typeof useTranslate>;

type CheckoutSummaryDialogProps = {
  plan: SubscriptionPlan;
  features: string[];
  isSubmitting: boolean;
  t: Translate;
  onClose: () => void;
  onConfirm: () => void;
};

/** Order review shown before Cashfree opens: plan price, GST, total payable. */
export function CheckoutSummaryDialog({
  plan,
  features,
  isSubmitting,
  t,
  onClose,
  onConfirm,
}: CheckoutSummaryDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const payButtonRef = useRef<HTMLButtonElement>(null);
  // Latest handlers without re-running the mount effect on every render.
  const onCloseRef = useRef(onClose);
  const isSubmittingRef = useRef(isSubmitting);
  useEffect(() => {
    onCloseRef.current = onClose;
    isSubmittingRef.current = isSubmitting;
  });

  const basePrice = plan.priceInr ?? 0;
  const gstRate = plan.gstRatePercent ?? 0;
  const gstAmount = plan.gstAmountInr ?? 0;
  const total = plan.totalPriceInr ?? basePrice;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmittingRef.current) onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => payButtonRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        aria-label={t("employer.subscriptionPage.checkout.close")}
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px] sm:bg-foreground/20 sm:backdrop-blur-sm"
        disabled={isSubmitting}
        onClick={onClose}
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={cn(
            "pointer-events-auto relative w-full max-w-md overflow-hidden bg-surface outline-none",
            "rounded-t-2xl border border-border-subtle shadow-[0_24px_64px_rgba(26,43,60,0.22)] ring-1 ring-black/5 sm:rounded-2xl",
            "max-h-[92dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]",
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 pt-5 pb-4 sm:px-6">
            <div>
              <h2 id={titleId} className="text-lg font-bold tracking-tight text-foreground">
                {t("employer.subscriptionPage.checkout.title")}
              </h2>
              <p id={descriptionId} className="mt-0.5 text-sm text-muted">
                {t("employer.subscriptionPage.checkout.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="-mt-1 -mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
              aria-label={t("employer.subscriptionPage.checkout.close")}
            >
              <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
            </button>
          </header>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="rounded-xl border border-primary/15 bg-primary-light/60 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-bold text-foreground">{plan.name}</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatInr(basePrice)}
                </p>
              </div>
              {features.length > 0 ? (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-primary/10"
                    >
                      <Check
                        className="size-3 text-benefit-whatsapp-icon"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{t("employer.subscriptionPage.checkout.planPrice")}</dt>
                <dd className="tabular-nums text-foreground">{formatInr(basePrice)}</dd>
              </div>
              {gstRate > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">
                    {t("employer.subscriptionPage.checkout.gst", { rate: gstRate })}
                  </dt>
                  <dd className="tabular-nums text-foreground">{formatInr(gstAmount)}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 border-t border-dashed border-border-subtle pt-3">
                <dt className="font-semibold text-foreground">
                  {t("employer.subscriptionPage.checkout.total")}
                </dt>
                <dd className="text-xl font-bold tabular-nums text-foreground">
                  {formatInr(total)}
                </dd>
              </div>
            </dl>

            <button
              ref={payButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Lock className="size-4" aria-hidden="true" />
              )}
              {isSubmitting
                ? t("employer.subscriptionPage.checkout.preparing")
                : t("employer.subscriptionPage.checkout.pay", { price: formatInr(total) })}
            </button>

            <div className="space-y-1.5 text-xs text-muted">
              <p className="flex items-start gap-1.5">
                <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {t("employer.subscriptionPage.checkout.secure")}
              </p>
              <p className="flex items-start gap-1.5">
                <ReceiptText className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {t("employer.subscriptionPage.checkout.invoiceNote")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
