"use client";

import { ROUTES } from "@/constants/routes";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import { useCan } from "@/providers/employer-permission-provider";
import {
  subscriptionQueryKeys,
  verifyPaymentOrder,
} from "@/services/subscription.service";
import type { PaymentOrderStatus } from "@/types/subscription";
import { getApiErrorMessage } from "@/utils/normalize-api-error";
import { formatInr } from "@/utils/subscription-upgrade";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Poll while Cashfree still reports the order as open (~1 minute). */
const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 20;
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{3,45}$/;

type StatusView = {
  tone: "success" | "error" | "pending";
  titleKey: MessageKey;
  bodyKey: MessageKey;
};

const STATUS_VIEWS: Record<PaymentOrderStatus, StatusView> = {
  paid: {
    tone: "success",
    titleKey: "employer.paymentStatus.paidTitle",
    bodyKey: "employer.paymentStatus.paidBody",
  },
  failed: {
    tone: "error",
    titleKey: "employer.paymentStatus.failedTitle",
    bodyKey: "employer.paymentStatus.failedBody",
  },
  user_dropped: {
    tone: "error",
    titleKey: "employer.paymentStatus.droppedTitle",
    bodyKey: "employer.paymentStatus.droppedBody",
  },
  expired: {
    tone: "error",
    titleKey: "employer.paymentStatus.expiredTitle",
    bodyKey: "employer.paymentStatus.expiredBody",
  },
  cancelled: {
    tone: "error",
    titleKey: "employer.paymentStatus.droppedTitle",
    bodyKey: "employer.paymentStatus.droppedBody",
  },
  created: {
    tone: "pending",
    titleKey: "employer.paymentStatus.pendingTitle",
    bodyKey: "employer.paymentStatus.pendingBody",
  },
};

const primaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function StatusShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-6 text-center shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}

export function PaymentStatusContent() {
  const t = useTranslate();
  const queryClient = useQueryClient();
  const { can } = useCan();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id")?.trim() ?? "";
  const hasValidOrderId = ORDER_ID_PATTERN.test(orderId);

  const orderQuery = useQuery({
    queryKey: subscriptionQueryKeys.order(orderId),
    queryFn: () => verifyPaymentOrder(orderId),
    enabled: hasValidOrderId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.data?.status === "created" && query.state.dataUpdateCount < MAX_POLLS
        ? POLL_INTERVAL_MS
        : false,
  });

  const status = orderQuery.data?.status;
  // Re-read on every render; each poll re-renders this component.
  const pollCount =
    queryClient.getQueryState(subscriptionQueryKeys.order(orderId))?.dataUpdateCount ?? 0;
  const isStillPolling = status === "created" && pollCount < MAX_POLLS;

  useEffect(() => {
    if (status && status !== "created") {
      void queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all });
    }
  }, [status, queryClient]);

  if (!hasValidOrderId) {
    return (
      <StatusShell>
        <XCircle className="mx-auto size-12 text-red-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-foreground">
          {t("employer.paymentStatus.title")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("employer.paymentStatus.missingOrder")}</p>
        <Link href={ROUTES.EMPLOYER_SUBSCRIPTION} className={clsx(primaryButton, "mt-6")}>
          {t("employer.paymentStatus.backToSubscription")}
        </Link>
      </StatusShell>
    );
  }

  if (orderQuery.isLoading || (isStillPolling && pollCount < 3)) {
    return (
      <StatusShell>
        <Loader2 className="mx-auto size-12 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-foreground" role="status">
          {t("employer.paymentStatus.checking")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("employer.paymentStatus.checkingNote")}</p>
      </StatusShell>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <StatusShell>
        <XCircle className="mx-auto size-12 text-red-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-foreground">
          {t("employer.paymentStatus.errorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted">{getApiErrorMessage(orderQuery.error, "")}</p>
        <p className="mt-1 text-xs text-muted">
          {t("employer.paymentStatus.orderId", { id: orderId })}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => void orderQuery.refetch()} className={primaryButton}>
            {t("employer.paymentStatus.checkAgain")}
          </button>
          <Link href={ROUTES.EMPLOYER_SUBSCRIPTION} className={secondaryButton}>
            {t("employer.paymentStatus.backToSubscription")}
          </Link>
        </div>
      </StatusShell>
    );
  }

  const order = orderQuery.data;
  const view = STATUS_VIEWS[order.status];
  const Icon =
    view.tone === "success" ? CheckCircle2 : view.tone === "pending" ? Clock : XCircle;

  return (
    <StatusShell>
      <Icon
        className={clsx(
          "mx-auto size-12",
          view.tone === "success" && "text-benefit-whatsapp-icon",
          view.tone === "pending" && "text-amber-600",
          view.tone === "error" && "text-red-600",
        )}
        aria-hidden="true"
      />
      <h1 className="mt-4 text-xl font-bold text-foreground" role="status">
        {t(view.titleKey)}
      </h1>
      <p className="mt-2 text-sm text-muted">{t(view.bodyKey, { plan: order.planName })}</p>

      <div className="mt-4 space-y-0.5 text-xs text-muted">
        <p>
          {t("employer.paymentStatus.amount", { amount: formatInr(order.amount) })}
          {order.gstAmount > 0
            ? ` · ${t("employer.paymentStatus.gstIncluded", { amount: formatInr(order.gstAmount) })}`
            : null}
        </p>
        <p className="break-all">{t("employer.paymentStatus.orderId", { id: order.orderId })}</p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {order.status === "paid" && can("jobs", "create") ? (
          <Link href={ROUTES.POST_JOB} className={primaryButton}>
            {t("employer.paymentStatus.postJob")}
          </Link>
        ) : null}
        {order.status === "created" ? (
          <button
            type="button"
            onClick={() => void orderQuery.refetch()}
            disabled={orderQuery.isFetching}
            className={clsx(primaryButton, "gap-2 disabled:opacity-60")}
          >
            {orderQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {t("employer.paymentStatus.checkAgain")}
          </button>
        ) : null}
        {view.tone === "error" ? (
          <Link href={ROUTES.EMPLOYER_SUBSCRIPTION} className={primaryButton}>
            {t("employer.paymentStatus.tryAgain")}
          </Link>
        ) : (
          <Link href={ROUTES.EMPLOYER_SUBSCRIPTION} className={secondaryButton}>
            {t("employer.paymentStatus.backToSubscription")}
          </Link>
        )}
      </div>
    </StatusShell>
  );
}
