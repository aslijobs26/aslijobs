import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  fetchHireAssistTicket,
  fetchHireAssistTickets,
  updateHireAssistTicketStatus,
  type HireAssistTicket,
} from "../services/hire-assist.service";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

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
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm md:flex-row md:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-muted">
            Search
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Name, email, mobile, or ticket ID"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Status
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-56 flex-col gap-1 text-xs font-medium text-muted">
            Request type
            <select
              value={assistanceType}
              onChange={(event) => {
                setPage(1);
                setAssistanceType(event.target.value);
              }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All Hire Assist types</option>
              {ASSISTANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Ticket ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Mobile</th>
                <th className="px-3 py-2 font-medium">Request type</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-muted" colSpan={10}>
                    Loading tickets…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-muted" colSpan={10}>
                    No Hire Assist tickets match these filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{item.ticketId}</td>
                    <td className="px-3 py-2">{item.fullName}</td>
                    <td className="px-3 py-2">{item.companyName}</td>
                    <td className="px-3 py-2">{item.email}</td>
                    <td className="px-3 py-2">{item.mobileNumber}</td>
                    <td className="px-3 py-2">{item.assistanceLabel}</td>
                    <td className="px-3 py-2">{item.source}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {item.statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatWhen(item.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void openTicket(item.id)}
                        className="text-sm font-semibold text-primary hover:underline"
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

        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            {total} ticket{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {detailError && !selected ? (
          <p className="text-sm text-red-700">{detailError}</p>
        ) : null}

        {selected ? (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
            <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-surface p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {selected.source}
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selected.ticketId}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm"
                >
                  Close
                </button>
              </div>

              <section className="mt-5">
                <h3 className="text-sm font-semibold text-foreground">Contact details</h3>
                <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <Detail label="Full name" value={selected.fullName} />
                  <Detail label="Company" value={selected.companyName} />
                  <Detail label="Mobile" value={selected.mobileNumber} />
                  <Detail label="Email" value={selected.email} />
                  <Detail label="Designation" value={selected.designation || "—"} />
                </dl>
              </section>

              <section className="mt-5">
                <h3 className="text-sm font-semibold text-foreground">Request details</h3>
                <dl className="mt-2 grid grid-cols-1 gap-2 text-sm">
                  <Detail label="Assistance type" value={selected.assistanceLabel} />
                  <Detail label="Status" value={selected.statusLabel} />
                  <Detail label="Submitted" value={formatWhen(selected.createdAt)} />
                  <Detail label="Updated" value={formatWhen(selected.updatedAt)} />
                </dl>
                <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-sm leading-6 text-foreground">
                  {selected.message}
                </p>
              </section>

              <section className="mt-5">
                <h3 className="text-sm font-semibold text-foreground">Update status</h3>
                <p className="mt-1 text-xs text-muted">
                  New tickets can be opened or closed. Move a ticket to Open before starting or resolving it.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value)}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    {STATUS_OPTIONS.filter((option) => allowed.has(option.value)).map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                  {nextStatus === "waiting" ? (
                    <textarea
                      value={waitingReason}
                      onChange={(event) => setWaitingReason(event.target.value)}
                      placeholder="Why is this ticket waiting?"
                      rows={3}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  ) : null}
                  {detailError ? (
                    <p className="text-sm text-red-700">{detailError}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={saving || nextStatus === selected.status}
                    onClick={() => void saveStatus()}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save status"}
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
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="break-words text-foreground">{value}</dd>
    </div>
  );
}
