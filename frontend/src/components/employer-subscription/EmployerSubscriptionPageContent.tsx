"use client";

import { CheckoutSummaryDialog } from "@/components/employer-subscription/CheckoutSummaryDialog";
import { EnterpriseEnquiryForm } from "@/components/employer-subscription/EnterpriseEnquiryForm";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { useCan } from "@/providers/employer-permission-provider";
import {
  createPaymentOrder,
  downloadPaymentInvoice,
  fetchMyPaymentOrders,
  fetchMySubscription,
  fetchSubscriptionPlans,
  subscriptionQueryKeys,
} from "@/services/subscription.service";
import type {
  PaymentOrder,
  PaymentOrderStatus,
  PurchasablePlanCode,
  SubscriptionGrant,
  SubscriptionPlan,
} from "@/types/subscription";
import { openCashfreeCheckout } from "@/utils/cashfree-checkout";
import { getApiErrorMessage } from "@/utils/normalize-api-error";
import { showAppToast } from "@/utils/share-job";
import { formatInr } from "@/utils/subscription-upgrade";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Translate = ReturnType<typeof useTranslate>;

const BEST_VALUE_PLAN: PurchasablePlanCode = "starter_299";

const ORDER_STATUS_TONE: Record<PaymentOrderStatus, string> = {
  created: "bg-amber-50 text-amber-700",
  paid: "bg-benefit-whatsapp-surface text-benefit-whatsapp-icon",
  failed: "bg-red-50 text-red-700",
  user_dropped: "bg-hero-bg text-muted",
  expired: "bg-hero-bg text-muted",
  cancelled: "bg-hero-bg text-muted",
};

function jobsLabel(t: Translate, count: number): string {
  return count === 1
    ? t("employer.subscriptionPage.jobsOne")
    : t("employer.subscriptionPage.jobsMany", { count });
}

function citiesLabel(t: Translate, count: number): string {
  return count === 1
    ? t("employer.subscriptionPage.citiesOne")
    : t("employer.subscriptionPage.citiesMany", { count });
}

function planFeatures(t: Translate, plan: SubscriptionPlan): string[] {
  const features: string[] = [];
  if (plan.jobCredits !== null) features.push(jobsLabel(t, plan.jobCredits));
  else features.push("Unlimited Job Post");
  if (plan.maxCities !== null) features.push(citiesLabel(t, plan.maxCities));
  else if (plan.code === "enterprise") features.push("5 City or Region Targeting");
  features.push("Unlimited Candidate Responses");
  if (plan.code === "starter_299") features.push("AI Candidate Shortlisting");
  if (plan.code === "growth_999") {
    features.push("AI sourcing & shortlisting", "Candidate data access");
  }
  if (plan.code === "enterprise") {
    features.push(
      "AI sourcing, shortlisting & coordination",
      "Bulk Hiring Support",
      "Dedicated Account Manager",
    );
  }
  return features;
}

function planDisplayName(plan: SubscriptionPlan): string {
  return plan.name.toUpperCase();
}

function planValidity(plan: SubscriptionPlan): string {
  return plan.listingValidityDays === null
    ? "Valid for 1 Year"
    : `Valid for ${plan.listingValidityDays} Days`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SectionCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5", className)}>
      <h2 className="text-base font-bold text-foreground sm:text-lg">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActiveGrantCard({ grant, planName, t }: { grant: SubscriptionGrant; planName: string; t: Translate }) {
  const percentLeft =
    grant.jobCredits > 0
      ? Math.round((grant.jobCreditsRemaining / grant.jobCredits) * 100)
      : 0;
  return (
    <li className="rounded-lg border border-border-subtle bg-hero-bg/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-bold text-foreground">{planName}</p>
        {grant.priceInr > 0 ? (
          <span className="shrink-0 text-xs font-semibold text-muted">
            {formatInr(grant.priceInr)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-foreground">
        {t("employer.subscriptionPage.grantCreditsLeft", {
          remaining: grant.jobCreditsRemaining,
          total: grant.jobCredits,
        })}
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentLeft}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentLeft}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {t("employer.subscriptionPage.validityDays", { days: grant.listingValidityDays })}
        {" · "}
        {citiesLabel(t, grant.maxCities)}
      </p>
      {grant.citiesUsed.length > 0 ? (
        <p className="mt-0.5 truncate text-xs text-muted">
          {t("employer.subscriptionPage.citiesUsed", {
            cities: grant.citiesUsed.join(", "),
          })}
        </p>
      ) : null}
    </li>
  );
}

function PlanCard({
  plan,
  t,
  canBuy,
  isBuying,
  buyDisabled,
  onBuy,
  onContactSales,
  canPostJob,
}: {
  plan: SubscriptionPlan;
  t: Translate;
  canBuy: boolean;
  isBuying: boolean;
  buyDisabled: boolean;
  onBuy: (plan: SubscriptionPlan) => void;
  onContactSales: () => void;
  canPostJob: boolean;
}) {
  const isBestValue = plan.code === BEST_VALUE_PLAN;
  const features = planFeatures(t, plan);

  const buttonBase =
        "mt-auto inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

  let action: React.ReactNode;
  if (plan.purchasable) {
    action = canBuy ? (
      <button
        type="button"
        onClick={() => onBuy(plan)}
        disabled={buyDisabled}
        className={clsx(
          buttonBase,
          isBestValue ? "bg-primary hover:bg-primary-hover" : "bg-neutral-400 hover:bg-neutral-500",
        )}
      >
        {isBuying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {isBuying
          ? t("employer.subscriptionPage.openingPayment")
          : "Start with Free"}
      </button>
    ) : (
      <p className="mt-auto text-center text-xs text-muted">
        {t("employer.subscriptionPage.noPermissionToBuy")}
      </p>
    );
  } else if (plan.contactSales) {
    action = (
      <button
        type="button"
        onClick={onContactSales}
        className={clsx(buttonBase, "bg-neutral-400 hover:bg-neutral-500")}
      >
        Contact Us
      </button>
    );
  } else {
    action = canPostJob ? (
      <Link
        href={ROUTES.POST_JOB}
        className={clsx(buttonBase, "bg-neutral-400 hover:bg-neutral-500")}
      >
        Start with Free
      </Link>
    ) : (
      <p className="mt-auto text-center text-xs text-muted">
        {t("employer.subscriptionPage.noPermissionToBuy")}
      </p>
    );
  }

  return (
    <li
      className={clsx(
        "relative flex min-h-90 flex-col rounded-2xl border border-transparent bg-white p-4 shadow-sm sm:p-5",
      )}
    >
      {isBestValue ? (
        <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
          Popular
        </span>
      ) : null}
      <p className="text-sm font-semibold tracking-wide text-primary">{planDisplayName(plan)}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="mt-2 text-xl font-semibold leading-tight text-foreground">
          {plan.priceInr === null
            ? t("employer.subscriptionPage.customPricing")
            : formatInr(plan.priceInr)}
        </span>
        {plan.purchasable ? (
          <span className="text-xs text-muted">{t("employer.subscriptionPage.perPlan")}</span>
        ) : null}
      </p>
      {plan.gstRatePercent ? <p className="text-xs font-medium text-muted">{t("employer.subscriptionPage.plusGst", { rate: plan.gstRatePercent })}</p> : null}
      <p className="mt-2 text-sm text-foreground">{planValidity(plan)}</p>
      <hr className="my-3 border-border" />
      {features.length > 0 ? (
        <ul className="mb-4 flex flex-1 flex-col gap-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
              <span aria-hidden="true" className="mt-0.5">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mb-4" />
      )}
      {action}
    </li>
  );
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke after the click has been handled so the download is not cut off.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PaymentHistory({ orders, t }: { orders: PaymentOrder[]; t: Translate }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(orderId: string) {
    setDownloadingId(orderId);
    try {
      const { blob, fileName } = await downloadPaymentInvoice(orderId);
      triggerBlobDownload(blob, fileName);
    } catch (error) {
      showAppToast(
        getApiErrorMessage(error, t("employer.subscriptionPage.history.downloadFailed")),
        "error",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  if (orders.length === 0) {
    return <p className="text-sm text-muted">{t("employer.subscriptionPage.history.empty")}</p>;
  }
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-140 text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-xs text-muted">
            <th className="px-4 py-2 font-medium sm:px-2">
              {t("employer.subscriptionPage.history.date")}
            </th>
            <th className="px-2 py-2 font-medium">{t("employer.subscriptionPage.history.plan")}</th>
            <th className="px-2 py-2 font-medium">
              {t("employer.subscriptionPage.history.amount")}
            </th>
            <th className="px-2 py-2 font-medium">
              {t("employer.subscriptionPage.history.status")}
            </th>
            <th className="px-4 py-2 text-right font-medium sm:px-2">
              {t("employer.subscriptionPage.history.invoice")}
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.orderId} className="border-b border-border-subtle last:border-0">
              <td className="px-4 py-2.5 whitespace-nowrap text-muted sm:px-2">
                {formatDate(order.paidAt ?? order.createdAt)}
              </td>
              <td className="px-2 py-2.5 font-medium text-foreground">{order.planName}</td>
              <td className="px-2 py-2.5 tabular-nums text-foreground">
                {formatInr(order.amount)}
                {order.gstAmount > 0 ? (
                  <span className="block text-[0.6875rem] text-muted">
                    {t("employer.subscriptionPage.history.inclGst")}
                  </span>
                ) : null}
              </td>
              <td className="px-2 py-2.5">
                <span
                  className={clsx(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                    ORDER_STATUS_TONE[order.status],
                  )}
                >
                  {t(`employer.subscriptionPage.orderStatus.${order.status}`)}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right sm:px-2">
                {order.status === "paid" ? (
                  <button
                    type="button"
                    onClick={() => void handleDownload(order.orderId)}
                    disabled={downloadingId === order.orderId}
                    aria-label={t("employer.subscriptionPage.history.downloadAria", {
                      plan: order.planName,
                    })}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-wait disabled:opacity-60"
                  >
                    {downloadingId === order.orderId ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="size-3.5" aria-hidden="true" />
                    )}
                    {t("employer.subscriptionPage.history.download")}
                  </button>
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmployerSubscriptionPageContent() {
  const t = useTranslate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useCan();
  const canBuy = can("subscription", "create");
  const canPostJob = can("jobs", "create");
  const [showEnterpriseForm, setShowEnterpriseForm] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);

  const plansQuery = useQuery({
    queryKey: subscriptionQueryKeys.plans,
    queryFn: fetchSubscriptionPlans,
    staleTime: 10 * 60 * 1000,
  });
  const mineQuery = useQuery({
    queryKey: subscriptionQueryKeys.mine,
    queryFn: fetchMySubscription,
  });
  const ordersQuery = useQuery({
    queryKey: subscriptionQueryKeys.orders,
    queryFn: fetchMyPaymentOrders,
  });

  const buyMutation = useMutation({
    mutationFn: async (planCode: PurchasablePlanCode) => {
      const order = await createPaymentOrder(planCode);
      // Hand the screen to Cashfree's popup once the order exists.
      setCheckoutPlan(null);
      const outcome = await openCashfreeCheckout(order);
      return { order, outcome };
    },
    onSuccess: ({ order, outcome }) => {
      if (outcome.kind === "completed") {
        router.push(
          `${ROUTES.EMPLOYER_PAYMENT_STATUS}?order_id=${encodeURIComponent(order.orderId)}`,
        );
        return;
      }
      if (outcome.kind === "closed") {
        showAppToast(t("employer.subscriptionPage.checkoutClosed"), "info");
        void queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.orders });
      }
    },
    onError: (error) => {
      showAppToast(
        getApiErrorMessage(error, t("employer.subscriptionPage.checkoutFailed")),
        "error",
      );
    },
  });

  const mine = mineQuery.data;
  const creditsLeft = mine?.jobCreditsRemaining ?? 0;

  return (
    <div className="employer-page-shell mx-auto w-full max-w-[1200px] space-y-4 px-3 pt-4 pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] sm:space-y-5 sm:px-5 sm:pt-5 md:pb-6">
      <header>
        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-2xl lg:text-[1.25rem]">
          {t("employer.subscriptionPage.title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted">{t("employer.subscriptionPage.subtitle")}</p>
      </header>

      {mineQuery.isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{t("employer.subscriptionPage.loadFailed")}</span>
          <button
            type="button"
            onClick={() => void mineQuery.refetch()}
            className="rounded-lg border border-red-300 px-3 py-1.5 font-semibold hover:bg-red-100"
          >
            {t("employer.common.tryAgain")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <section className="flex flex-col rounded-xl border border-primary/10 bg-primary-light p-4 sm:p-5">
            <p className="text-sm font-medium text-muted">
              {t("employer.subscriptionPage.creditsLeft")}
            </p>
            {mineQuery.isLoading ? (
              <div className="mt-2 h-10 w-16 animate-pulse rounded-lg bg-surface/70" />
            ) : (
              <p className="mt-1 text-4xl font-bold tabular-nums text-foreground">{creditsLeft}</p>
            )}
            {mine ? (
              <p
                className={clsx(
                  "mt-2 text-sm",
                  mine.canPostJob ? "text-foreground" : "font-medium text-red-700",
                )}
              >
                {mine.canPostJob
                  ? t("employer.subscriptionPage.canPost")
                  : t("employer.subscriptionPage.cannotPost")}
              </p>
            ) : null}
            {mine?.canPostJob && canPostJob ? (
              <Link
                href={ROUTES.POST_JOB}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {t("employer.subscriptionPage.postJob")}
              </Link>
            ) : null}
          </section>

          <SectionCard title={t("employer.subscriptionPage.activePlansTitle")}>
            {mineQuery.isLoading ? (
              <div className="h-24 animate-pulse rounded-lg bg-hero-bg" />
            ) : mine && mine.activeGrants.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {mine.activeGrants.map((grant) => (
                  <ActiveGrantCard
                    key={grant.id}
                    grant={grant}
                    planName={plansQuery.data?.find((plan) => plan.code === grant.planCode)?.name ?? grant.planName}
                    t={t}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t("employer.subscriptionPage.noActivePlans")}</p>
            )}
          </SectionCard>
        </div>
      )}

      <SectionCard
        title={t("employer.subscriptionPage.plansTitle")}
        subtitle={t("employer.subscriptionPage.plansSubtitle")}
        className="rounded-2xl border-0 bg-[#e3f5f1] p-3 shadow-none sm:p-5"
      >
        {plansQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="h-64 animate-pulse rounded-xl bg-hero-bg" />
            ))}
          </div>
        ) : plansQuery.isError ? (
          <p role="alert" className="text-sm text-red-700">
            {getApiErrorMessage(plansQuery.error, t("employer.subscriptionPage.loadFailed"))}
          </p>
        ) : (
          <ul className="grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-4">
            {(plansQuery.data ?? []).map((plan) => (
              <PlanCard
                key={plan.code}
                plan={plan}
                t={t}
                canBuy={canBuy}
                isBuying={buyMutation.isPending && buyMutation.variables === plan.code}
                buyDisabled={buyMutation.isPending}
                canPostJob={canPostJob}
                onBuy={setCheckoutPlan}
                onContactSales={() => setShowEnterpriseForm(true)}
              />
            ))}
          </ul>
        )}

        {checkoutPlan ? (
          <CheckoutSummaryDialog
            plan={checkoutPlan}
            features={planFeatures(t, checkoutPlan)}
            isSubmitting={buyMutation.isPending}
            t={t}
            onClose={() => setCheckoutPlan(null)}
            onConfirm={() => buyMutation.mutate(checkoutPlan.code as PurchasablePlanCode)}
          />
        ) : null}

        {showEnterpriseForm ? (
          <EnterpriseEnquiryForm onClose={() => setShowEnterpriseForm(false)} />
        ) : null}
      </SectionCard>

      <SectionCard title={t("employer.subscriptionPage.history.title")}>
        {ordersQuery.isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-hero-bg" />
        ) : (
          <PaymentHistory orders={ordersQuery.data ?? []} t={t} />
        )}
      </SectionCard>
    </div>
  );
}
