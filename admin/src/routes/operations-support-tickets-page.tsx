import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  fetchHireAssistTicket,
  fetchHireAssistTickets,
  updateHireAssistTicketStatus,
  type HireAssistTicket,
} from "../services/hire-assist.service";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Search, Save, Workflow } from "lucide-react";
import { OperationsBadge } from "../components/ui/OperationsBadge";
import { OperationsCard } from "../components/ui/OperationsCard";
import { operationsFieldInputClassName } from "../components/ui/OperationsFormField";
import { cn } from "../utils/cn";
import { tableRowHover } from "../components/ui/table-row-hover";

const ASSISTANCE_OPTIONS = [
  { value: "job_posting", label: "Job Posting Assistance" },
  { value: "candidate_sourcing", label: "Candidate Sourcing" },
  { value: "bulk_hiring", label: "Bulk Hiring Assistance" },
  { value: "blue_collar", label: "Blue Collar Workforce Hiring" },
  { value: "grey_collar", label: "Grey Collar Workforce Hiring" },
  { value: "candidate_shortlisting", label: "Candidate Shortlisting" },
  { value: "whatsapp_hiring", label: "WhatsApp Hiring Assistance" },
  { value: "employer_account", label: "Employer Account Assistance" },
  { value: "employer_verification", label: "Employer Verification Assistance" },
  { value: "subscription_payment", label: "Subscription / Payment Assistance" },
  { value: "technical_support", label: "Technical Support" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "queued", label: "New" },
  { value: "assigned", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "completed", label: "Resolved" },
  { value: "cancelled", label: "Closed" },
];

const NEXT_STATUS: Record<string, string[]> = {
  queued: ["assigned", "cancelled"],
  assigned: ["in_progress", "queued", "cancelled"],
  in_progress: ["waiting", "completed", "assigned", "cancelled"],
  waiting: ["in_progress", "assigned", "cancelled"],
  completed: [],
  cancelled: [],
};

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

function statusBadgeVariant(
  status: string,
): "medium" | "default" | "verification" | "job" | "candidate" | "low" | "support" {
  switch (status) {
    case "queued":
      return "medium";
    case "assigned":
      return "default";
    case "in_progress":
      return "verification";
    case "waiting":
      return "job";
    case "completed":
      return "candidate";
    case "cancelled":
      return "low";
    default:
      return "support";
  }
}

export function OperationsSupportTicketsPage() {
  const [items, setItems] = useState<HireAssistTicket[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assistanceType, setAssistanceType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<HireAssistTicket | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [waitingReason, setWaitingReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailError, setDetailError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchHireAssistTickets({
        page,
        search,
        status,
        assistanceType,
      });
      setItems(result.items);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [assistanceType, page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openTicket(id: string) {
    setDetailError("");
    try {
      const ticket = await fetchHireAssistTicket(id);
      setSelected(ticket);
      setNextStatus(ticket.status);
      setWaitingReason("");
    } catch (openError) {
      setDetailError(errorMessage(openError));
    }
  }

  async function saveStatus() {
    if (!selected || nextStatus === selected.status) return;
    setSaving(true);
    setDetailError("");
    try {
      const updated = await updateHireAssistTicketStatus(selected.id, {
        status: nextStatus,
        expectedRevision: selected.revision,
        waitingReason: nextStatus === "waiting" ? waitingReason : undefined,
      });
      setSelected(updated);
      setNextStatus(updated.status);
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (saveError) {
      setDetailError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  const allowed = selected
    ? new Set([selected.status, ...(NEXT_STATUS[selected.status] ?? [])])
    : new Set<string>();

  return (
    <OperationsLayout
      title="Support Tickets"
      subtitle="Hire Assist requests submitted from the website."
    >
      <div className="flex min-w-0 flex-col gap-3">
        <OperationsCard
          title="Find support requests"
          subtitle="Search by requester or narrow tickets by status and request type."
          className="ops-brand-border-glow"
          bodyClassName="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_minmax(160px,0.65fr)_minmax(220px,0.8fr)_auto] xl:items-end"
          action={
            search || status || assistanceType ? (
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setSearch("");
                  setStatus("");
                  setAssistanceType("");
                }}
                className="inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Clear filters
              </button>
            ) : null
          }
        >
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold text-foreground">Search</span>
            <span className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Name, email, mobile, or ticket ID"
                className={cn(operationsFieldInputClassName, "pl-9")}
              />
            </span>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold text-foreground">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className={operationsFieldInputClassName}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold text-foreground">Request type</span>
            <select
              value={assistanceType}
              onChange={(event) => {
                setPage(1);
                setAssistanceType(event.target.value);
              }}
              className={operationsFieldInputClassName}
            >
              <option value="">All Hire Assist types</option>
              {ASSISTANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </OperationsCard>

        <OperationsCard
          title="Hire Assist tickets"
          subtitle="Requests submitted from the website."
          badge={
            <OperationsBadge variant="support">
              {total.toLocaleString("en-IN")} total
            </OperationsBadge>
          }
          className="ops-brand-border-glow overflow-hidden"
          bodyClassName="p-0"
        >
          <ul className="flex flex-col gap-2.5 p-2.5 xl:hidden">
            {loading ? (
              <li className="px-2 py-10 text-center text-xs text-muted">
                Loading tickets…
              </li>
            ) : error ? (
              <li className="p-4 text-center">
                <p className="text-xs font-medium text-danger">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-2 inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Retry
                </button>
              </li>
            ) : items.length === 0 ? (
              <li className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-foreground">No tickets found</p>
                <p className="mt-1 text-xs text-muted">
                  Try changing your search or filters.
                </p>
              </li>
            ) : (
              items.map((item) => (
                <li
                  key={item.id}
                  className="min-w-0 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm md:p-4"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border-subtle pb-2.5 md:items-center md:pb-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-semibold text-primary">
                        {item.ticketId}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-foreground md:text-[13px]">
                        {item.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {item.companyName}
                      </p>
                    </div>
                    <OperationsBadge variant={statusBadgeVariant(item.status)}>
                      {item.statusLabel}
                    </OperationsBadge>
                  </div>
                  <div className="mt-3 grid min-w-0 grid-cols-2 gap-x-3 gap-y-3 text-[11px] md:grid-cols-3 md:gap-x-5">
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wide text-muted">
                        Request
                      </span>
                      <span className="mt-0.5 block break-words font-medium text-foreground">
                        {item.assistanceLabel}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wide text-muted">
                        Submitted
                      </span>
                      <span className="mt-0.5 block text-foreground">
                        {formatWhen(item.createdAt)}
                      </span>
                    </div>
                    <div className="col-span-2 min-w-0 md:col-span-1">
                      <span className="block text-[10px] uppercase tracking-wide text-muted">
                        Contact
                      </span>
                      <span className="mt-0.5 block break-all text-foreground">
                        {item.email}
                      </span>
                      <span className="mt-0.5 block text-muted">{item.mobileNumber}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-subtle pt-2.5 text-[11px] md:pt-3">
                    <span className="text-muted">
                      Source: <span className="font-medium text-foreground">{item.source}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void openTicket(item.id)}
                      className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary-light px-3 font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      View details
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="hidden overflow-x-auto overscroll-x-contain scrollbar-hidden xl:block">
            <table className="min-w-[920px] w-full text-left text-xs">
              <thead className="border-b border-border-subtle bg-hero-bg/60 text-muted">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 pl-4 text-[10px] font-semibold uppercase tracking-wide">
                    Ticket
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide">
                    Requester
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide">
                    Contact
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide">
                    Source
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide">
                    Status
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide">
                    Created
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 pr-4 text-right text-[10px] font-semibold uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-xs text-muted" colSpan={7}>
                      Loading tickets…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-4 py-10 text-center" colSpan={7}>
                      <p className="text-xs font-medium text-danger">{error}</p>
                      <button
                        type="button"
                        onClick={() => void load()}
                        className="mt-2 inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center" colSpan={7}>
                      <p className="text-sm font-semibold text-foreground">No tickets found</p>
                      <p className="mt-1 text-xs text-muted">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className={cn("align-middle", tableRowHover)}>
                      <td className="max-w-[13rem] px-3 py-3 pl-4">
                        <span className="block truncate font-mono text-[11px] font-semibold text-primary">
                          {item.ticketId}
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-muted">
                          {item.assistanceLabel}
                        </span>
                      </td>
                      <td className="max-w-[12rem] px-3 py-3">
                        <span className="block truncate text-xs font-semibold text-foreground">
                          {item.fullName}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted">
                          {item.companyName}
                        </span>
                      </td>
                      <td className="max-w-[15rem] px-3 py-3">
                        <span className="block truncate text-[11px] text-foreground">
                          {item.email}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {item.mobileNumber}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[11px] text-muted">
                        {item.source}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <OperationsBadge variant={statusBadgeVariant(item.status)}>
                          {item.statusLabel}
                        </OperationsBadge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[11px] text-muted">
                        {formatWhen(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openTicket(item.id)}
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-border-subtle px-3 py-2.5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <span>
              {total.toLocaleString("en-IN")} ticket{total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-8 items-center rounded-lg border border-border-subtle px-3 font-semibold text-foreground transition hover:bg-hero-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex h-8 items-center rounded-lg border border-border-subtle px-3 font-semibold text-foreground transition hover:bg-hero-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </OperationsCard>

        {detailError && !selected ? (
          <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
            {detailError}
          </p>
        ) : null}

        {selected ? (
          <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-[2px]">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="support-ticket-title"
              className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border-subtle bg-surface p-4 shadow-2xl sm:p-5"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {selected.source}
                  </p>
                  <h2 id="support-ticket-title" className="mt-1 text-base font-semibold text-foreground">
                    {selected.ticketId}
                  </h2>
                  <div className="mt-2">
                    <OperationsBadge variant={statusBadgeVariant(selected.status)}>
                      {selected.statusLabel}
                    </OperationsBadge>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex h-8 items-center rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground transition hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Close
                </button>
              </div>

              <section className="mt-4 rounded-xl border border-border-subtle bg-hero-bg/40 p-3">
                <h3 className="text-xs font-semibold text-foreground">Contact details</h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <Detail label="Full name" value={selected.fullName} />
                  <Detail label="Company" value={selected.companyName} />
                  <Detail label="Mobile" value={selected.mobileNumber} />
                  <Detail label="Email" value={selected.email} />
                  <Detail label="Designation" value={selected.designation || "—"} />
                </dl>
              </section>

              <section className="mt-3 rounded-xl border border-border-subtle bg-hero-bg/40 p-3">
                <h3 className="text-xs font-semibold text-foreground">Request details</h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 text-xs">
                  <Detail label="Assistance type" value={selected.assistanceLabel} />
                  <Detail label="Submitted" value={formatWhen(selected.createdAt)} />
                  <Detail label="Updated" value={formatWhen(selected.updatedAt)} />
                </dl>
                <p className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-border-subtle bg-surface p-3 text-xs leading-5 text-foreground">
                  {selected.message}
                </p>
              </section>

              <section className="mt-3 rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm sm:p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Workflow className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      Update ticket status
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      Choose the next step and save it to this ticket.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-border-subtle bg-hero-bg/50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Status transition
                  </p>
                  <div className="mt-2 flex min-w-0 items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[10px] text-muted">Current</p>
                      <OperationsBadge
                        variant={statusBadgeVariant(selected.status)}
                        className="max-w-full truncate"
                      >
                        {selected.statusLabel}
                      </OperationsBadge>
                    </div>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[10px] text-muted">Next</p>
                      <OperationsBadge
                        variant={statusBadgeVariant(nextStatus)}
                        className="max-w-full truncate"
                      >
                        {STATUS_OPTIONS.find((option) => option.value === nextStatus)
                          ?.label ?? nextStatus}
                      </OperationsBadge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-foreground">
                      New status
                    </span>
                    <select
                      value={nextStatus}
                      onChange={(event) => setNextStatus(event.target.value)}
                      aria-label="New ticket status"
                      className={operationsFieldInputClassName}
                    >
                      {STATUS_OPTIONS.filter((option) => allowed.has(option.value)).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                    <span className="text-[10px] leading-relaxed text-muted">
                      New tickets can be opened or closed. Move a ticket to Open before starting or resolving it.
                    </span>
                  </label>
                  {nextStatus === "waiting" ? (
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-foreground">
                        Reason for waiting
                      </span>
                      <textarea
                        value={waitingReason}
                        onChange={(event) => setWaitingReason(event.target.value)}
                        placeholder="Add context for the follow-up..."
                        rows={3}
                        aria-label="Reason for waiting"
                        className="min-h-[88px] w-full resize-y rounded-lg border border-border-subtle bg-hero-bg/60 px-3 py-2.5 text-xs text-foreground outline-none placeholder:text-muted transition-[border-color,box-shadow,background-color] focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30"
                      />
                      <span className="text-[10px] text-muted">
                        This note helps the team understand what is blocking progress.
                      </span>
                    </label>
                  ) : null}
                </div>

                {detailError ? (
                  <p
                    className="mt-3 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger"
                    role="alert"
                  >
                    <AlertCircle
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{detailError}</span>
                  </p>
                ) : null}

                <div className="mt-4 flex justify-end border-t border-border-subtle pt-3">
                  <button
                    type="button"
                    disabled={saving || nextStatus === selected.status}
                    onClick={() => void saveStatus()}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {saving ? (
                      "Saving…"
                    ) : (
                      <>
                        <Save className="size-3.5" aria-hidden="true" />
                        Save status change
                      </>
                    )}
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </OperationsLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-xs font-medium text-foreground">{value}</dd>
    </div>
  );
}
