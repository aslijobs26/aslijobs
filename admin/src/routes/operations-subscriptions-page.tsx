import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, BadgeCheck, IndianRupee, UsersRound, type LucideIcon } from "lucide-react";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import {
  fetchOperationsSubscriptions,
  fetchOperationsSubscriptionsAnalytics,
  createOperationsPaymentLink,
  updateOperationsSubscriptionGrant,
  updateOperationsSubscriptionPlan,
  type OperationsSubscriptionGrant,
  type OperationsSubscriptionPlan,
  type OperationsSubscriptionsPeriod,
  type CreatedOperationsPaymentLink,
} from "../services/operations-subscriptions.service";

const inputClass = "min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
const buttonClass = "inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass = "inline-flex min-h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:bg-hero-bg disabled:opacity-60";

function inr(value: number | null) {
  return value === null ? "Custom pricing" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

export function OperationsSubscriptionsPage() {
  const queryClient = useQueryClient();
  const { can } = useOperationsPermissions();
  const canEdit = can("billing", "update");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<OperationsSubscriptionsPeriod>("30d");
  const [editingPlan, setEditingPlan] = useState<OperationsSubscriptionPlan | null>(null);
  const [editingGrant, setEditingGrant] = useState<OperationsSubscriptionGrant | null>(null);
  const [creatingPaymentLink, setCreatingPaymentLink] = useState(false);
  const [initialPaymentPlanCode, setInitialPaymentPlanCode] = useState<OperationsSubscriptionPlan["code"]>("starter_299");
  const [notice, setNotice] = useState("");
  const query = useQuery({ queryKey: ["operations", "subscriptions"], queryFn: fetchOperationsSubscriptions });
  const analyticsQuery = useQuery({
    queryKey: ["operations", "subscriptions", "analytics", period],
    queryFn: () => fetchOperationsSubscriptionsAnalytics(period),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["operations", "subscriptions"] });
  const savePlan = useMutation({ mutationFn: updateOperationsSubscriptionPlan, onSuccess: async () => { setEditingPlan(null); setNotice("Plan settings saved. New purchases will use these settings."); await refresh(); } });
  const saveGrant = useMutation({ mutationFn: updateOperationsSubscriptionGrant, onSuccess: async () => { setEditingGrant(null); setNotice("Employer subscription updated."); await refresh(); } });
  const createOperationsPaymentLinkMutation = useMutation({ mutationFn: createOperationsPaymentLink });
  const filteredGrants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data?.grants ?? []).filter((grant) => !term || [grant.employerName, grant.companyName, grant.email, grant.planName].some((value) => value.toLowerCase().includes(term)));
  }, [query.data?.grants, search]);

  return (
    <OperationsLayout title="Subscriptions & boosters" subtitle="Edit plan settings for future purchases and adjust active employer entitlements.">
      <div className="space-y-6 pb-8">
        {notice ? <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}
        {query.isError ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Could not load subscriptions. <button className="ml-2 font-semibold underline" onClick={() => void query.refetch()}>Try again</button></div> : null}

        <section aria-label="Subscription key metrics" aria-busy={analyticsQuery.isLoading}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-lg font-bold text-foreground">Subscription overview</h2><p className="text-sm text-muted">Payments follow the selected period; active plans are current.</p></div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted">Payment period
              <select className={`${inputClass} w-auto min-w-40`} value={period} onChange={(event) => setPeriod(event.target.value as OperationsSubscriptionsPeriod)}>
                <option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="ytd">Year to date</option><option value="all">All time</option>
              </select>
            </label>
          </div>
          {analyticsQuery.isError ? <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Could not load subscription metrics. <button className="ml-2 font-semibold underline" onClick={() => void analyticsQuery.refetch()}>Try again</button></div> : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={IndianRupee} tone="teal" label="Paid revenue" value={inr(analyticsQuery.data?.paidRevenueInr ?? 0)} detail="Successful payments in period" loading={analyticsQuery.isLoading} />
            <KpiCard icon={BadgeCheck} tone="blue" label="Successful payments" value={String(analyticsQuery.data?.successfulPayments ?? 0)} detail="Paid orders in period" loading={analyticsQuery.isLoading} />
            <KpiCard icon={UsersRound} tone="violet" label="Active employer plans" value={String(analyticsQuery.data?.activeEmployerPlans ?? 0)} detail="Active plan grants now" loading={analyticsQuery.isLoading} />
            <KpiCard icon={Award} tone="amber" label="Most used payment plan" value={analyticsQuery.data?.mostUsedPlanCode ? query.data?.plans.find((plan) => plan.code === analyticsQuery.data?.mostUsedPlanCode)?.name ?? analyticsQuery.data.mostUsedPlanCode : "No paid purchases yet"} detail={analyticsQuery.data?.mostUsedPlanPayments ? `${analyticsQuery.data.mostUsedPlanPayments} paid orders in period` : "Paid orders in period"} loading={analyticsQuery.isLoading} />
          </div>
        </section>

        <section className="space-y-3">
          <header>
            <h2 className="text-lg font-bold text-foreground">Plan catalog</h2>
            <p className="text-sm text-muted">Changes apply to future purchases and newly granted plans. Existing employer grants keep their current limits.</p>
          </header>
          {query.isLoading ? <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">Loading plans…</div> : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {(query.data?.plans ?? []).map((plan) => (
                <article key={plan.code} className="flex flex-col rounded-xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-foreground">{plan.name}</h3><span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">{plan.code}</span></div>
                  <p className="mt-2 text-xl font-bold text-foreground">{inr(plan.priceInr)}</p>
                  <p className="mt-2 text-sm text-muted">{plan.jobCredits === null ? "Custom job credits" : `${plan.jobCredits} job post${plan.jobCredits === 1 ? "" : "s"}`}</p>
                  <p className="text-sm text-muted">{plan.listingValidityDays === null ? "Custom validity" : `${plan.listingValidityDays} days`} · {plan.maxCities === null ? "Custom cities" : `${plan.maxCities} ${plan.maxCities === 1 ? "city" : "cities"}`}</p>
                  <p className="mt-2 line-clamp-2 min-h-10 text-xs text-muted">{plan.description}</p>
                  {canEdit ? <div className="mt-4 grid gap-2"><button className={secondaryButtonClass} onClick={() => { setNotice(""); setEditingPlan({ ...plan }); }}>Edit plan</button>{plan.code === "enterprise" ? <button className={buttonClass} onClick={() => { setInitialPaymentPlanCode("enterprise"); setCreatingPaymentLink(true); }}>Create custom offer</button> : null}</div> : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-lg font-bold text-foreground">Employer subscriptions</h2><p className="text-sm text-muted">Edit limits on active grants. Credits already used cannot be removed.</p></div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><input className={`${inputClass} w-full sm:w-80`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employer, company, email, plan" aria-label="Search subscriptions" />{canEdit ? <button className={`${buttonClass} shrink-0`} onClick={() => { setInitialPaymentPlanCode("starter_299"); setCreatingPaymentLink(true); }}>Create payment link</button> : null}</div>
          </header>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-hero-bg text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Employer</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Price (before GST)</th><th className="px-4 py-3">Posts</th><th className="px-4 py-3">Validity</th><th className="px-4 py-3">Cities</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredGrants.map((grant) => <tr key={grant.id}>
                  <td className="px-4 py-3"><p className="font-semibold text-foreground">{grant.companyName || grant.employerName}</p><p className="text-xs text-muted">{grant.email || grant.employerName}</p></td>
                  <td className="px-4 py-3"><p className="font-medium text-foreground">{grant.planName}</p><p className="text-xs text-muted">{grant.source.replaceAll("_", " ")}</p></td>
                  <td className="px-4 py-3 font-medium tabular-nums">{grant.priceInr > 0 ? inr(grant.priceInr) : grant.source === "auto_free" ? "Free" : "Complimentary"}</td>
                  <td className="px-4 py-3 tabular-nums">{grant.jobCreditsUsed} used / {grant.jobCredits}</td><td className="px-4 py-3">{grant.listingValidityDays} days</td><td className="px-4 py-3">{grant.maxCities}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-hero-bg px-2 py-1 text-xs capitalize">{grant.status}</span></td>
                  <td className="px-4 py-3">{canEdit && grant.status === "active" ? <button className={secondaryButtonClass} onClick={() => { setNotice(""); setEditingGrant({ ...grant }); }}>Edit</button> : <span className="text-xs text-muted">—</span>}</td>
                </tr>)}
                {!query.isLoading && filteredGrants.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">No subscriptions found.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">Showing the latest {query.data?.grants.length ?? 0} subscription grants.</p>
        </section>

        {editingPlan ? <PlanEditor plan={editingPlan} saving={savePlan.isPending} error={savePlan.error instanceof Error ? savePlan.error.message : ""} onChange={setEditingPlan} onClose={() => setEditingPlan(null)} onSave={() => savePlan.mutate(editingPlan)} /> : null}
        {editingGrant ? <GrantEditor grant={editingGrant} saving={saveGrant.isPending} error={saveGrant.error instanceof Error ? saveGrant.error.message : ""} onChange={setEditingGrant} onClose={() => setEditingGrant(null)} onSave={() => saveGrant.mutate({ id: editingGrant.id, jobCredits: editingGrant.jobCredits, listingValidityDays: editingGrant.listingValidityDays, maxCities: editingGrant.maxCities })} /> : null}
        {creatingPaymentLink ? <PaymentLinkEditor initialPlanCode={initialPaymentPlanCode} grants={query.data?.grants ?? []} plans={(query.data?.plans ?? []).filter((plan) => plan.code === "enterprise" || (plan.purchasable && plan.priceInr !== null && plan.priceInr > 0))} saving={createOperationsPaymentLinkMutation.isPending} error={createOperationsPaymentLinkMutation.error instanceof Error ? createOperationsPaymentLinkMutation.error.message : ""} created={createOperationsPaymentLinkMutation.data ?? null} onCreate={(input) => createOperationsPaymentLinkMutation.mutate(input)} onClose={() => { setCreatingPaymentLink(false); createOperationsPaymentLinkMutation.reset(); }} /> : null}
      </div>
    </OperationsLayout>
  );
}

function PaymentLinkEditor({ initialPlanCode, grants, plans, saving, error, created, onCreate, onClose }: { initialPlanCode: OperationsSubscriptionPlan["code"]; grants: OperationsSubscriptionGrant[]; plans: OperationsSubscriptionPlan[]; saving: boolean; error: string; created: CreatedOperationsPaymentLink | null; onCreate: (input: { employerId: string; planCode: OperationsSubscriptionPlan["code"]; discountPercent: number; expiryHours: 1 | 6 | 24; customPlan?: { name: string; priceInr: number; jobCredits: number; listingValidityDays: number; maxCities: number } }) => void; onClose: () => void }) {
  const [employerId, setEmployerId] = useState("");
  const [planCode, setPlanCode] = useState<OperationsSubscriptionPlan["code"]>(initialPlanCode);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [expiryHours, setExpiryHours] = useState<1 | 6 | 24>(24);
  const [customName, setCustomName] = useState("Business Hiring");
  const [customPrice, setCustomPrice] = useState(0);
  const [customCredits, setCustomCredits] = useState(5);
  const [customValidity, setCustomValidity] = useState(30);
  const [customCities, setCustomCities] = useState(2);
  const [copied, setCopied] = useState(false);
  const employers = useMemo(() => [...new Map(grants.filter((grant) => grant.phone.trim()).map((grant) => [grant.employerId, grant])).values()], [grants]);
  const selectedPlan = plans.find((plan) => plan.code === planCode);
  const isCustomPlan = planCode === "enterprise";
  const selectedEmployer = employers.find((grant) => grant.employerId === employerId);
  const listPrice = isCustomPlan ? customPrice : selectedPlan?.priceInr ?? 0;
  const discounted = Math.round(listPrice * (1 - discountPercent / 100) * 100) / 100;
  const estimatedTotal = Math.round(discounted * 1.18 * 100) / 100;
  const message = created ? `Hello${selectedEmployer?.companyName ? ` ${selectedEmployer.companyName}` : ""},\n\nYour ${created.planName} plan payment link is ready.\nIncludes ${created.jobCredits} job posts, ${created.listingValidityDays} days validity, up to ${created.maxCities} cities.\nPlan price: ${inr(created.planPrice)}\nDiscount: ${created.discountPercent}% (${inr(created.discountAmount)})\nPrice after discount: ${inr(created.baseAmount)}\nGST (${created.gstRatePercent}%): ${inr(created.gstAmount)}\nTotal payable: ${inr(created.amount)}\n\nPay securely here: ${created.url}\nLink expires: ${new Date(created.expiresAt).toLocaleString()}` : "";
  const mailto = created?.employerEmail ? `mailto:${encodeURIComponent(created.employerEmail).replace(/%40/gi, "@")}?subject=${encodeURIComponent(`${created.planName} payment link - AsliJobs`)}&body=${encodeURIComponent(message)}` : "";
  const phoneDigits = (created?.employerPhone ?? "").replace(/\D/g, "");
  const whatsAppNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const whatsApp = created && whatsAppNumber ? `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}` : "";
  const copyLink = async () => { if (created) { await navigator.clipboard.writeText(created.url); setCopied(true); } };

  return <ModalShell title="Create payment link" onClose={onClose}>
    {!created ? <>
      <p className="mb-4 text-sm text-muted">Choose an employer and plan, apply a percentage discount, then create a secure Cashfree checkout link.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm font-medium text-foreground sm:col-span-2">Employer<select className={inputClass} value={employerId} onChange={(event) => setEmployerId(event.target.value)}><option value="">Select employer</option>{employers.map((employer) => <option key={employer.employerId} value={employer.employerId}>{employer.companyName || employer.employerName} — {employer.email || employer.phone}</option>)}</select>{employers.length === 0 ? <span className="text-xs font-normal text-amber-700">No employers with a WhatsApp number were found in the subscription list.</span> : null}</label>
        <label className="block space-y-1 text-sm font-medium text-foreground sm:col-span-2">Plan<select className={inputClass} value={planCode} onChange={(event) => setPlanCode(event.target.value as OperationsSubscriptionPlan["code"])}>{plans.map((plan) => <option key={plan.code} value={plan.code}>{plan.code === "enterprise" ? `${plan.name} — set custom terms` : `${plan.name} — ${inr(plan.priceInr)} before GST`}</option>)}</select></label>
        {isCustomPlan ? <div className="grid gap-4 rounded-xl border border-border-subtle bg-hero-bg p-4 sm:col-span-2 sm:grid-cols-2"><div className="sm:col-span-2"><p className="font-semibold text-foreground">Custom Business Hiring terms</p><p className="mt-1 text-xs text-muted">These terms are saved only for this employer and payment order.</p></div>
          <label className="block space-y-1 text-sm font-medium text-foreground">Offer name<input className={inputClass} maxLength={80} value={customName} onChange={(event) => setCustomName(event.target.value)} /></label>
          <label className="block space-y-1 text-sm font-medium text-foreground">Price before GST (₹)<input className={inputClass} type="number" min={1} step="0.01" value={customPrice || ""} onChange={(event) => setCustomPrice(Number(event.target.value) || 0)} /></label>
          <label className="block space-y-1 text-sm font-medium text-foreground">Job post credits<input className={inputClass} type="number" min={1} step={1} value={customCredits} onChange={(event) => setCustomCredits(Math.max(1, Number(event.target.value) || 1))} /></label>
          <label className="block space-y-1 text-sm font-medium text-foreground">Validity per post (days)<input className={inputClass} type="number" min={1} step={1} value={customValidity} onChange={(event) => setCustomValidity(Math.max(1, Number(event.target.value) || 1))} /></label>
          <label className="block space-y-1 text-sm font-medium text-foreground">Maximum cities<input className={inputClass} type="number" min={1} step={1} value={customCities} onChange={(event) => setCustomCities(Math.max(1, Number(event.target.value) || 1))} /></label>
        </div> : null}
        <label className="block space-y-1 text-sm font-medium text-foreground">Discount (%)<input className={inputClass} type="number" min={0} max={100} step="0.5" value={discountPercent} onChange={(event) => setDiscountPercent(Math.max(0, Math.min(100, Number(event.target.value) || 0)))} /></label>
        <label className="block space-y-1 text-sm font-medium text-foreground">Link expiry<select className={inputClass} value={expiryHours} onChange={(event) => setExpiryHours(Number(event.target.value) as 1 | 6 | 24)}><option value={1}>1 hour</option><option value={6}>6 hours</option><option value={24}>24 hours</option></select></label>
      </div>
      {selectedPlan ? <div className="mt-4 rounded-xl border border-border-subtle bg-hero-bg p-4 text-sm"><p className="font-semibold text-foreground">Payment preview</p>{isCustomPlan ? <p className="mt-1 text-xs text-muted">{customCredits} job posts · {customValidity} days · up to {customCities} cities</p> : null}<div className="mt-2 space-y-1 text-muted"><p>{isCustomPlan ? "Custom price before GST" : "Plan price before GST"}<span className="float-right">{inr(listPrice)}</span></p><p>Discount ({discountPercent}%) <span className="float-right">−{inr(listPrice - discounted)}</span></p><p>Price after discount <span className="float-right">{inr(discounted)}</span></p><p>GST (18%) <span className="float-right">{inr(estimatedTotal - discounted)}</span></p><p className="border-t border-border-subtle pt-2 font-bold text-foreground">Total payable <span className="float-right">{inr(estimatedTotal)}</span></p></div><p className="mt-2 text-xs text-muted">Final tax and payable amount are calculated by the server.</p></div> : null}
      {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <footer className="mt-5 flex justify-end gap-2"><button className={secondaryButtonClass} onClick={onClose} disabled={saving}>Cancel</button><button className={buttonClass} disabled={saving || !employerId || !selectedPlan || listPrice <= 0 || discounted < 1 || !customName.trim()} onClick={() => onCreate({ employerId, planCode, discountPercent, expiryHours, ...(isCustomPlan ? { customPlan: { name: customName.trim(), priceInr: customPrice, jobCredits: customCredits, listingValidityDays: customValidity, maxCities: customCities } } : {}) })}>{saving ? "Creating link…" : "Create link"}</button></footer>
    </> : <>
      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-900">Payment link created</p><p className="mt-1 text-sm text-emerald-800">{created.planName} · {created.discountPercent}% discount · {inr(created.amount)} including GST</p><p className="mt-3 break-all rounded-lg bg-white px-3 py-2 text-sm text-foreground">{created.url}</p><p className="mt-2 text-xs text-emerald-800">Expires {new Date(created.expiresAt).toLocaleString()}</p></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3"><a className={`${buttonClass} ${!mailto ? "pointer-events-none opacity-50" : ""}`} href={mailto || undefined}>Email link</a><a className={`${buttonClass} ${!whatsApp ? "pointer-events-none opacity-50" : ""}`} href={whatsApp || undefined} target="_blank" rel="noreferrer">WhatsApp message</a><button type="button" className={secondaryButtonClass} onClick={() => void copyLink()}>{copied ? "Copied" : "Copy link"}</button></div>
      <p className="mt-3 text-xs text-muted">Email and WhatsApp open a prefilled message for review. You send it from your own app.</p>
      {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <footer className="mt-5 flex justify-end"><button className={secondaryButtonClass} onClick={onClose}>Done</button></footer>
    </>}
  </ModalShell>;
}

function KpiCard({ icon: Icon, tone, label, value, detail, loading }: { icon: LucideIcon; tone: "teal" | "blue" | "violet" | "amber"; label: string; value: string; detail: string; loading: boolean }) {
  const toneClasses = {
    teal: "bg-teal-500/10 text-teal-600 ring-teal-500/15",
    blue: "bg-blue-500/10 text-blue-600 ring-blue-500/15",
    violet: "bg-violet-500/10 text-violet-600 ring-violet-500/15",
    amber: "bg-amber-500/10 text-amber-700 ring-amber-500/15",
  }[tone];
  return <article className="relative min-h-36 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5" aria-label={label}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {loading ? <div className="mt-4 h-8 w-32 animate-pulse rounded bg-hero-bg" /> : <p className="mt-3 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl" title={value}>{value}</p>}
      </div>
      <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClasses}`}><Icon className="size-5" aria-hidden="true" /></span>
    </div>
    <p className="mt-3 border-t border-border-subtle pt-2.5 text-xs text-muted">{detail}</p>
  </article>;
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-5 shadow-2xl"><header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-foreground">{title}</h2><button className={secondaryButtonClass} onClick={onClose}>Close</button></header>{children}</section></div>;
}

function PlanEditor({ plan, saving, error, onChange, onClose, onSave }: { plan: OperationsSubscriptionPlan; saving: boolean; error: string; onChange: (plan: OperationsSubscriptionPlan) => void; onClose: () => void; onSave: () => void }) {
  const text = (key: "name" | "packageLabel" | "description", label: string) => <label className="block space-y-1 text-sm font-medium text-foreground">{label}<input className={inputClass} value={plan[key]} onChange={(event) => onChange({ ...plan, [key]: event.target.value })} /></label>;
  const number = (key: "priceInr" | "jobCredits" | "listingValidityDays" | "maxCities", label: string) => <label className="block space-y-1 text-sm font-medium text-foreground">{label}<input className={inputClass} type="number" min={key === "priceInr" ? 0 : 1} step={key === "priceInr" ? "0.01" : 1} value={plan[key] ?? ""} placeholder="Custom / not set" onChange={(event) => onChange({ ...plan, [key]: event.target.value === "" ? null : Number(event.target.value) })} /></label>;
  return <ModalShell title={`Edit ${plan.name}`} onClose={onClose}><div className="grid gap-4 sm:grid-cols-2">{text("name", "Plan name")}{number("priceInr", "Price (₹, before GST)")}{number("jobCredits", "Job post credits")}{number("listingValidityDays", "Listing validity (days)")}{number("maxCities", "Maximum cities")}{text("packageLabel", "Job package label")}<label className="block space-y-1 text-sm font-medium text-foreground sm:col-span-2">Description<textarea className={`${inputClass} min-h-20 py-2`} value={plan.description} onChange={(event) => onChange({ ...plan, description: event.target.value })} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.purchasable} onChange={(event) => onChange({ ...plan, purchasable: event.target.checked })} />Available for online purchase</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={plan.contactSales} onChange={(event) => onChange({ ...plan, contactSales: event.target.checked })} />Contact sales</label></div>{error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}<footer className="mt-5 flex justify-end gap-2"><button className={secondaryButtonClass} onClick={onClose} disabled={saving}>Cancel</button><button className={buttonClass} onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save plan"}</button></footer></ModalShell>;
}

function GrantEditor({ grant, saving, error, onChange, onClose, onSave }: { grant: OperationsSubscriptionGrant; saving: boolean; error: string; onChange: (grant: OperationsSubscriptionGrant) => void; onClose: () => void; onSave: () => void }) {
  const number = (key: "jobCredits" | "listingValidityDays" | "maxCities", label: string) => <label className="block space-y-1 text-sm font-medium text-foreground">{label}<input className={inputClass} type="number" min={key === "jobCredits" ? grant.jobCreditsUsed : 1} step={1} value={grant[key]} onChange={(event) => onChange({ ...grant, [key]: Number(event.target.value) })} /></label>;
  return <ModalShell title={`Edit ${grant.planName} for ${grant.companyName || grant.employerName}`} onClose={onClose}><p className="mb-4 text-sm text-muted">{grant.email} · {grant.jobCreditsUsed} job post(s) already used</p><div className="grid gap-4 sm:grid-cols-3">{number("jobCredits", "Total job post credits")}{number("listingValidityDays", "Listing validity (days)")}{number("maxCities", "Maximum cities")}</div>{error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}<footer className="mt-5 flex justify-end gap-2"><button className={secondaryButtonClass} onClick={onClose} disabled={saving}>Cancel</button><button className={buttonClass} onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save subscription"}</button></footer></ModalShell>;
}
