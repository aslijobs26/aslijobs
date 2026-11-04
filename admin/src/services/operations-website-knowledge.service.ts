import { apiClient } from "./api-client";

const BASE = "/operations/website-knowledge";

export type WebsiteKnowledgeStatusResponse = {
  status: Record<string, unknown> | null;
  crawlEnabled: boolean;
  autoSyncEnabled: boolean;
  semanticEnabled: boolean;
  browserFallbackEnabled?: boolean;
  whatsappE2E?: {
    e2eEnabled: boolean;
    credentialsConfigured: boolean;
    allowlistConfigured: boolean;
    allowlistSize: number;
    liveSendAllowed: boolean;
    reason: string;
  };
  frontendOrigin: string;
  health: Record<string, unknown>;
  embedding: {
    provider: string;
    model: string;
    dims: number;
    ready: boolean;
    error: string | null;
    backend?: string;
  };
  metrics: Record<string, number>;
  counts: {
    documents: number;
    activeDocuments: number;
    inactiveDocuments: number;
    faqs: number;
    chunks: number;
    policySections: number;
    indexedChunks: number;
    browserExtracted?: number;
  };
  recentOps: Array<Record<string, unknown>>;
  recentE2EAudit?: Array<Record<string, unknown>>;
};

export type WebsiteKnowledgeDocumentItem = {
  path: string;
  title: string;
  sectionHeading: string;
  sourceType: string;
  language: string;
  active: boolean;
  canonicalUrl: string;
  fetchedAt?: string;
  contentPreview: string;
};

export async function fetchWebsiteKnowledgeStatus() {
  const response = await apiClient.get<{ data: WebsiteKnowledgeStatusResponse }>(
    `${BASE}/status`,
  );
  return response.data.data;
}

export async function fetchWebsiteKnowledgeDocuments(input?: {
  q?: string;
  page?: number;
  pageSize?: number;
  sourceType?: string;
  active?: boolean;
}) {
  const response = await apiClient.get<{
    data: { total: number; items: WebsiteKnowledgeDocumentItem[] };
  }>(`${BASE}/documents`, { params: input });
  return response.data.data;
}

export async function refreshWebsiteKnowledge(input?: {
  crawl?: boolean;
  async?: boolean;
}) {
  const response = await apiClient.post<{ data: Record<string, unknown> }>(
    `${BASE}/refresh`,
    input ?? {},
  );
  return response.data.data;
}

export async function refreshWebsiteKnowledgePage(path: string) {
  const response = await apiClient.post<{ data: { op: Record<string, unknown> } }>(
    `${BASE}/refresh-page`,
    { path },
  );
  return response.data.data;
}

export async function reindexWebsiteKnowledge(input: {
  mode: "one" | "changed" | "all";
  path?: string;
  sectionHeading?: string;
}) {
  const response = await apiClient.post<{ data: { op: Record<string, unknown> } }>(
    `${BASE}/reindex`,
    input,
  );
  return response.data.data;
}

export async function diagnoseWebsiteKnowledge(input: {
  query: string;
  account?: "none" | "seeker" | "employer";
  recipient?: string;
}) {
  const response = await apiClient.post<{ data: Record<string, unknown> }>(
    `${BASE}/diagnose`,
    input,
  );
  return response.data.data;
}

export async function diagnoseSendWebsiteKnowledge(input: {
  query: string;
  recipient: string;
  mode: "mock" | "live";
  confirm: boolean;
}) {
  const response = await apiClient.post<{ data: Record<string, unknown> }>(
    `${BASE}/diagnose-send`,
    input,
  );
  return response.data.data;
}
