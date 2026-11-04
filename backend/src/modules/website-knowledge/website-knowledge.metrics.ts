type CounterMap = Record<string, number>;

const counters: CounterMap = Object.create(null);

export function bumpKnowledgeMetric(name: string, by = 1): void {
  counters[name] = (counters[name] ?? 0) + by;
}

export function getKnowledgeMetricsSnapshot(): Readonly<CounterMap> {
  return { ...counters };
}

export function resetKnowledgeMetrics(): void {
  for (const key of Object.keys(counters)) delete counters[key];
}

export function knowledgeHealthSnapshot(input: {
  mongoReady: boolean;
  syncWorker: "idle" | "running" | "disabled";
  semanticEnabled: boolean;
  lastSyncStatus?: string | null;
  documentCount?: number;
  faqCount?: number;
}): Record<string, unknown> {
  return {
    mongoReady: input.mongoReady,
    syncWorker: input.syncWorker,
    semanticEnabled: input.semanticEnabled,
    lastSyncStatus: input.lastSyncStatus ?? null,
    documentCount: input.documentCount ?? 0,
    faqCount: input.faqCount ?? 0,
    metrics: getKnowledgeMetricsSnapshot(),
  };
}
