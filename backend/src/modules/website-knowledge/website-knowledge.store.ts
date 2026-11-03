import type {
  KnowledgeDocument,
  KnowledgeFaq,
  KnowledgeSyncStatus,
} from "./website-knowledge.types.js";

type MemoryState = {
  documents: KnowledgeDocument[];
  faqs: KnowledgeFaq[];
  sync: KnowledgeSyncStatus | null;
};

const memory: MemoryState = {
  documents: [],
  faqs: [],
  sync: null,
};

export function resetWebsiteKnowledgeMemory(): void {
  memory.documents = [];
  memory.faqs = [];
  memory.sync = null;
}

export function getMemoryKnowledgeDocuments(): KnowledgeDocument[] {
  return memory.documents.filter((doc) => doc.active);
}

export function getMemoryKnowledgeFaqs(): KnowledgeFaq[] {
  return memory.faqs.filter((faq) => faq.active);
}

export function getMemoryKnowledgeSyncStatus(): KnowledgeSyncStatus | null {
  return memory.sync ? { ...memory.sync } : null;
}

export function upsertMemoryKnowledgeDocuments(docs: KnowledgeDocument[]): void {
  const byKey = new Map(
    memory.documents.map((doc) => [`${doc.path}|${doc.sectionHeading}|${doc.language}`, doc]),
  );
  for (const doc of docs) {
    byKey.set(`${doc.path}|${doc.sectionHeading}|${doc.language}`, doc);
  }
  memory.documents = [...byKey.values()];
}

export function upsertMemoryKnowledgeFaqs(faqs: KnowledgeFaq[]): void {
  const byKey = new Map(
    memory.faqs.map((faq) => [`${faq.normalizedQuestion}|${faq.language}`, faq]),
  );
  for (const faq of faqs) {
    byKey.set(`${faq.normalizedQuestion}|${faq.language}`, faq);
  }
  memory.faqs = [...byKey.values()];
}

export function deactivateMemoryMissing(
  activePaths: Set<string>,
  activeFaqKeys: Set<string>,
): void {
  memory.documents = memory.documents.map((doc) =>
    activePaths.has(`${doc.path}|${doc.sectionHeading}|${doc.language}`)
      ? doc
      : { ...doc, active: false },
  );
  memory.faqs = memory.faqs.map((faq) =>
    activeFaqKeys.has(`${faq.normalizedQuestion}|${faq.language}`)
      ? faq
      : { ...faq, active: false },
  );
}

export function setMemoryKnowledgeSyncStatus(status: KnowledgeSyncStatus): void {
  memory.sync = status;
}

/** Preserve previous content when a refresh yields empty payloads. */
export function shouldReplaceKnowledgeContent(
  previous: string | undefined,
  next: string,
): boolean {
  const prev = (previous ?? "").trim();
  const upcoming = next.trim();
  if (!upcoming) return false;
  if (!prev) return true;
  // Reject near-empty replacements that would wipe a known-good page.
  const minKeep = Math.max(24, Math.floor(prev.length * 0.35));
  return upcoming.length >= minKeep;
}
