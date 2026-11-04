import { useCallback, useEffect, useState } from "react";
import { BookOpen, RefreshCw, Search, Sparkles } from "lucide-react";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  diagnoseSendWebsiteKnowledge,
  diagnoseWebsiteKnowledge,
  fetchWebsiteKnowledgeDocuments,
  fetchWebsiteKnowledgeStatus,
  refreshWebsiteKnowledge,
  refreshWebsiteKnowledgePage,
  reindexWebsiteKnowledge,
  type WebsiteKnowledgeDocumentItem,
  type WebsiteKnowledgeStatusResponse,
} from "../services/operations-website-knowledge.service";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function OperationsWebsiteKnowledgePage() {
  const [status, setStatus] = useState<WebsiteKnowledgeStatusResponse | null>(null);
  const [docs, setDocs] = useState<WebsiteKnowledgeDocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [diagQuery, setDiagQuery] = useState("What is AsliJobs?");
  const [diagResult, setDiagResult] = useState<Record<string, unknown> | null>(null);
  const [e2eRecipient, setE2eRecipient] = useState("");
  const [e2eConfirm, setE2eConfirm] = useState(false);
  const [e2eSendResult, setE2eSendResult] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, docsData] = await Promise.all([
        fetchWebsiteKnowledgeStatus(),
        fetchWebsiteKnowledgeDocuments({ q: q || undefined, page, pageSize: 20 }),
      ]);
      setStatus(statusData);
      setDocs(docsData.items);
      setTotal(docsData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load knowledge status");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await action();
      setToast(`${label} completed`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${label} failed`);
    } finally {
      setBusy(null);
    }
  }

  const counts = status?.counts;

  return (
    <OperationsLayout
      title="Website Knowledge"
      subtitle="Official website corpus, crawl sync, semantic index, and diagnostics"
    >
      <div className="space-y-4">
        {toast ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {toast}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Stat label="Documents" value={counts?.documents ?? "—"} />
          <Stat label="Active" value={counts?.activeDocuments ?? "—"} />
          <Stat label="FAQs" value={counts?.faqs ?? "—"} />
          <Stat label="Chunks" value={counts?.chunks ?? "—"} />
          <Stat label="Indexed" value={counts?.indexedChunks ?? "—"} />
          <Stat label="Policy sections" value={counts?.policySections ?? "—"} />
          <Stat
            label="Last sync"
            value={
              status?.status && typeof status.status.lastSuccessAt === "string"
                ? new Date(status.status.lastSuccessAt).toLocaleString()
                : "—"
            }
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <RefreshCw className="h-4 w-4" /> Sync & crawl
            </h2>
            <p className="mt-1 text-xs text-muted">
              Crawl: {status?.crawlEnabled ? "on" : "off"} · Auto-sync:{" "}
              {status?.autoSyncEnabled ? "on" : "off"} · Browser fallback:{" "}
              {status?.browserFallbackEnabled ? "on" : "off"} · Browser docs:{" "}
              {counts?.browserExtracted ?? 0}
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              Origin: {status?.frontendOrigin || "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={Boolean(busy)}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50"
                onClick={() =>
                  void run("Full refresh", () =>
                    refreshWebsiteKnowledge({ crawl: true, async: false }),
                  )
                }
              >
                Full refresh
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                onClick={() =>
                  void run("Corpus refresh", () =>
                    refreshWebsiteKnowledge({ crawl: false, async: false }),
                  )
                }
              >
                Corpus only
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                onClick={() => void run("Reload", () => load())}
              >
                Reload status
              </button>
            </div>
            {busy ? <p className="mt-2 text-xs text-muted">Working: {busy}…</p> : null}
          </section>

          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Semantic index
            </h2>
            <p className="mt-1 text-xs text-muted">
              Enabled: {status?.semanticEnabled ? "yes" : "no"} · Provider:{" "}
              {status?.embedding?.provider || "—"} · Model: {status?.embedding?.model || "—"} ·
              Dims: {status?.embedding?.dims ?? "—"} · Backend:{" "}
              {status?.embedding?.backend || "—"}
            </p>
            {status?.embedding?.error ? (
              <p className="mt-1 text-xs text-amber-700">Model error: {status.embedding.error}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={Boolean(busy)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                onClick={() =>
                  void run("Reindex changed", () =>
                    reindexWebsiteKnowledge({ mode: "changed" }),
                  )
                }
              >
                Reindex changed
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                onClick={() => {
                  if (!window.confirm("Reindex all knowledge chunks?")) return;
                  void run("Reindex all", () => reindexWebsiteKnowledge({ mode: "all" }));
                }}
              >
                Reindex all
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Search className="h-4 w-4" /> Diagnose query
          </h2>
          <p className="mt-1 text-xs text-muted">
            Intent + retrieval + message preview. Live Meta send is opt-in, allowlisted, and
            confirmation-gated (default disabled).
          </p>
          <p className="mt-1 text-xs text-muted">
            WhatsApp E2E: {status?.whatsappE2E?.e2eEnabled ? "flag on" : "flag off"} ·{" "}
            {status?.whatsappE2E?.reason || "—"}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={diagQuery}
              onChange={(e) => setDiagQuery(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Ask a knowledge question"
            />
            <button
              type="button"
              disabled={Boolean(busy) || !diagQuery.trim()}
              className="rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-50"
              onClick={() =>
                void run("Diagnose", async () => {
                  const result = await diagnoseWebsiteKnowledge({
                    query: diagQuery.trim(),
                    account: "none",
                    recipient: e2eRecipient.trim() || undefined,
                  });
                  setDiagResult(result);
                  setE2eSendResult(null);
                })
              }
            >
              Run diagnose
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={e2eRecipient}
              onChange={(e) => setE2eRecipient(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Authorized test recipient (env allowlist only)"
              autoComplete="off"
            />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={e2eConfirm}
                onChange={(e) => setE2eConfirm(e.target.checked)}
              />
              Confirm explicit send
            </label>
            <button
              type="button"
              disabled={Boolean(busy) || !diagQuery.trim() || !e2eRecipient.trim() || !e2eConfirm}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium disabled:opacity-50"
              onClick={() =>
                void run("E2E mock send", async () => {
                  const result = await diagnoseSendWebsiteKnowledge({
                    query: diagQuery.trim(),
                    recipient: e2eRecipient.trim(),
                    mode: "mock",
                    confirm: e2eConfirm,
                  });
                  setE2eSendResult(result);
                })
              }
            >
              Mock send
            </button>
            <button
              type="button"
              disabled={
                Boolean(busy)
                || !diagQuery.trim()
                || !e2eRecipient.trim()
                || !e2eConfirm
                || !status?.whatsappE2E?.liveSendAllowed
              }
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 disabled:opacity-50"
              onClick={() => {
                if (
                  !window.confirm(
                    "Send ONE live Meta WhatsApp message to the allowlisted test recipient?",
                  )
                ) {
                  return;
                }
                void run("E2E live send", async () => {
                  const result = await diagnoseSendWebsiteKnowledge({
                    query: diagQuery.trim(),
                    recipient: e2eRecipient.trim(),
                    mode: "live",
                    confirm: e2eConfirm,
                  });
                  setE2eSendResult(result);
                });
              }}
            >
              Live send
            </button>
          </div>
          {diagResult ? (
            <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-muted/40 p-3 text-[11px] leading-relaxed">
              {JSON.stringify(diagResult, null, 2)}
            </pre>
          ) : null}
          {e2eSendResult ? (
            <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-950">
              {JSON.stringify(e2eSendResult, null, 2)}
            </pre>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4" /> Documents
            </h2>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                void load();
              }}
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                placeholder="Search title / URL / content"
              />
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium"
              >
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-muted">Loading…</p>
          ) : docs.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No documents in memory yet. Run a corpus or crawl refresh.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Path</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr
                      key={`${doc.path}|${doc.sectionHeading}|${doc.language}`}
                      className="border-b border-border/70 align-top"
                    >
                      <td className="px-2 py-2">
                        <div className="font-medium text-foreground">{doc.sectionHeading}</div>
                        <div className="mt-1 max-w-md text-[11px] text-muted">
                          {doc.contentPreview}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <a
                          href={doc.canonicalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-700 underline"
                        >
                          {doc.path}
                        </a>
                      </td>
                      <td className="px-2 py-2">{doc.sourceType}</td>
                      <td className="px-2 py-2">{doc.active ? "yes" : "no"}</td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          disabled={Boolean(busy)}
                          className="rounded border border-border px-2 py-1 disabled:opacity-50"
                          onClick={() =>
                            void run(`Refresh ${doc.path}`, () =>
                              refreshWebsiteKnowledgePage(doc.path),
                            )
                          }
                        >
                          Refresh page
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>
              Page {page} · {total} total
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || Boolean(busy)}
                className="rounded border border-border px-2 py-1 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page * 20 >= total || Boolean(busy)}
                className="rounded border border-border px-2 py-1 disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </OperationsLayout>
  );
}
