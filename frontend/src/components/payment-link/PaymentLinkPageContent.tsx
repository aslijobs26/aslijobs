"use client";

import { openCashfreeCheckout } from "@/utils/cashfree-checkout";
import { fetchPublicPaymentLink, verifyPublicPaymentLink } from "@/services/payment-link.service";
import { getApiErrorMessage } from "@/utils/normalize-api-error";
import { formatInr } from "@/utils/subscription-upgrade";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60";

export function PaymentLinkPageContent({ token }: { token: string }) {
  const search = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"paid" | "pending" | "failed" | null>(null);
  const [error, setError] = useState("");
  const linkQuery = useQuery({ queryKey: ["public-payment-link", token], queryFn: () => fetchPublicPaymentLink(token), retry: false });

  useEffect(() => {
    if (linkQuery.data?.status === "paid") setStatus("paid");
  }, [linkQuery.data?.status]);

  useEffect(() => {
    if (!search.get("order_id")) return;
    let active = true;
    const check = async () => {
      for (let attempt = 0; attempt < 8 && active; attempt += 1) {
        try {
          const result = await verifyPublicPaymentLink(token);
          if (!active) return;
          if (result.status === "paid") { setStatus("paid"); return; }
          if (["failed", "user_dropped", "expired", "cancelled"].includes(result.status)) { setStatus("failed"); return; }
          setStatus("pending");
        } catch (cause) { if (active) setError(getApiErrorMessage(cause, "Could not verify this payment.")); return; }
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
      }
    };
    void check();
    return () => { active = false; };
  }, [search, token]);

  const pay = async () => {
    if (!linkQuery.data) return;
    setBusy(true); setError("");
    try {
      const outcome = await openCashfreeCheckout(linkQuery.data);
      if (outcome.kind === "closed" && outcome.message) setError(outcome.message);
      const result = await verifyPublicPaymentLink(token);
      setStatus(result.status === "paid" ? "paid" : result.status === "created" ? "pending" : "failed");
    } catch (cause) { setError(getApiErrorMessage(cause, "Checkout could not be started. Please try again.")); }
    finally { setBusy(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
    <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-teal-700">AsliJobs</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Secure payment</h1>
      {linkQuery.isLoading ? <div className="mt-8 flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-5 animate-spin" />Loading payment details…</div> : null}
      {linkQuery.isError ? <div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{getApiErrorMessage(linkQuery.error, "This payment link is invalid or has expired.")}</div> : null}
      {linkQuery.data ? <>
        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Selected plan</p><p className="mt-1 font-semibold text-slate-900">{linkQuery.data.planName}</p>
          {linkQuery.data.jobCredits ? <p className="mt-2 text-sm text-slate-600">{linkQuery.data.jobCredits} job posts · {linkQuery.data.listingValidityDays} days per post · up to {linkQuery.data.maxCities} cities</p> : null}
          {linkQuery.data.discountPercent > 0 ? <p className="mt-3 text-sm text-emerald-700">{linkQuery.data.discountPercent}% discount applied (−{formatInr(linkQuery.data.discountAmount)})</p> : null}
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4"><span className="text-sm text-slate-600">Total including GST</span><strong className="text-xl text-slate-900">{formatInr(linkQuery.data.amount)}</strong></div>
          <p className="mt-1 text-xs text-slate-500">Link expires {new Date(linkQuery.data.expiresAt).toLocaleString()}</p>
        </div>
        {status === "paid" ? <div role="status" className="mt-5 flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 className="size-6" /><div><p className="font-semibold">Payment successful</p><p className="text-sm">Your plan is active. You can sign in to your employer account to continue.</p></div></div> : null}
        {status === "pending" ? <p role="status" className="mt-4 text-sm text-amber-700">Payment is processing. This page will update when it is confirmed.</p> : null}
        {status === "failed" ? <div role="status" className="mt-4 flex items-center gap-2 text-sm text-red-700"><XCircle className="size-5" />Payment was not completed. You can try again.</div> : null}
        {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
        {status !== "paid" ? <button type="button" className={`${buttonClass} mt-6 w-full`} onClick={() => void pay()} disabled={busy}>{busy ? "Checking payment…" : status === "failed" ? "Try payment again" : "Pay securely"}</button> : null}
        <p className="mt-4 text-center text-xs text-slate-500">Payments are processed securely by Cashfree. Your plan activates after payment confirmation.</p>
      </> : null}
    </section>
  </main>;
}
