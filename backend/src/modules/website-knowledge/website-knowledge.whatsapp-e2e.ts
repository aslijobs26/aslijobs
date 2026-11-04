/**
 * Admin-only Meta WhatsApp E2E diagnostic helpers for website knowledge.
 * Disabled by default. Never sends without explicit confirmation + allowlist.
 */
import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { toWhatsAppCloudRecipient } from "../../utils/whatsapp-phone.js";
import { WhatsAppService } from "../whatsapp/whatsapp.service.js";

const whatsAppService = new WhatsAppService();

export type WhatsAppE2EEligibility = {
  e2eEnabled: boolean;
  credentialsConfigured: boolean;
  allowlistConfigured: boolean;
  allowlistSize: number;
  liveSendAllowed: boolean;
  reason: string;
};

export type WhatsAppE2EAuditEntry = {
  auditId: string;
  at: string;
  adminUserId: string;
  mode: "mock" | "live";
  recipientMasked: string;
  authorized: boolean;
  confirmed: boolean;
  accepted: boolean;
  messageIdShort: string | null;
  messageStatus: string | null;
  error: string | null;
  correlationId: string;
  previewChars: number;
};

const auditLog: WhatsAppE2EAuditEntry[] = [];
let lastLiveSendAtMs = 0;
const LIVE_SEND_COOLDOWN_MS = 60_000;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseWhatsAppE2EAllowlist(raw?: string): string[] {
  const source = raw ?? env.WHATSAPP_E2E_ALLOWED_RECIPIENTS ?? "";
  const parts = source
    .split(/[,;\s]+/)
    .map((p) => digitsOnly(p.trim()))
    .filter(Boolean);
  const normalized = new Set<string>();
  for (const part of parts) {
    try {
      normalized.add(toWhatsAppCloudRecipient(part));
    } catch {
      // Skip malformed entries rather than failing the whole allowlist.
    }
  }
  return [...normalized];
}

export function maskWhatsAppRecipientSafe(recipient: string): string {
  const digits = digitsOnly(recipient);
  if (digits.length < 6) return "***";
  return `${digits.slice(0, 2)}****${digits.slice(-4)}`;
}

export function shortenMessageId(messageId: string | null | undefined): string | null {
  const id = (messageId || "").trim();
  if (!id) return null;
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function isRecipientAuthorizedForE2E(recipientRaw: string): {
  authorized: boolean;
  recipient: string | null;
  reason: string;
} {
  const allowlist = parseWhatsAppE2EAllowlist();
  if (allowlist.length === 0) {
    return { authorized: false, recipient: null, reason: "allowlist_empty" };
  }
  let recipient: string;
  try {
    recipient = toWhatsAppCloudRecipient(recipientRaw);
  } catch {
    return { authorized: false, recipient: null, reason: "invalid_recipient" };
  }
  if (!allowlist.includes(recipient)) {
    return { authorized: false, recipient, reason: "recipient_not_allowlisted" };
  }
  return { authorized: true, recipient, reason: "ok" };
}

export function getWhatsAppE2EEligibility(): WhatsAppE2EEligibility {
  const e2eEnabled = Boolean(env.WHATSAPP_E2E_ENABLED);
  const credentialsConfigured = Boolean(
    env.WHATSAPP_ACCESS_TOKEN?.trim() && env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
  const allowlist = parseWhatsAppE2EAllowlist();
  const allowlistConfigured = allowlist.length > 0;
  if (!e2eEnabled) {
    return {
      e2eEnabled,
      credentialsConfigured,
      allowlistConfigured,
      allowlistSize: allowlist.length,
      liveSendAllowed: false,
      reason: "WHATSAPP_E2E_ENABLED is false (default)",
    };
  }
  if (!credentialsConfigured) {
    return {
      e2eEnabled,
      credentialsConfigured,
      allowlistConfigured,
      allowlistSize: allowlist.length,
      liveSendAllowed: false,
      reason: "Meta credentials not configured",
    };
  }
  if (!allowlistConfigured) {
    return {
      e2eEnabled,
      credentialsConfigured,
      allowlistConfigured,
      allowlistSize: 0,
      liveSendAllowed: false,
      reason: "WHATSAPP_E2E_ALLOWED_RECIPIENTS is empty",
    };
  }
  return {
    e2eEnabled,
    credentialsConfigured,
    allowlistConfigured,
    allowlistSize: allowlist.length,
    liveSendAllowed: true,
    reason: "eligible_with_explicit_confirmation",
  };
}

export function listWhatsAppE2EAudit(limit = 20): WhatsAppE2EAuditEntry[] {
  return auditLog.slice(0, Math.max(1, limit));
}

function pushAudit(entry: WhatsAppE2EAuditEntry): void {
  auditLog.unshift(entry);
  if (auditLog.length > 100) auditLog.length = 100;
}

export function buildKnowledgeWhatsAppPreview(input: {
  answer: string;
  sourceUrl?: string;
  language?: string;
}): string {
  const answer = input.answer.trim().slice(0, 3_200);
  const source = (input.sourceUrl || "").trim();
  const lines = [answer];
  if (source) lines.push("", `Source: ${source}`);
  lines.push("", "— AsliJobs knowledge diagnostic (authorized test)");
  return lines.join("\n").slice(0, 3_900);
}

export async function executeKnowledgeWhatsAppE2E(input: {
  adminUserId: string;
  recipientRaw: string;
  messageBody: string;
  confirm: boolean;
  mode: "mock" | "live";
  correlationId?: string;
}): Promise<{
  ok: boolean;
  mode: "mock" | "live";
  authorized: boolean;
  accepted: boolean;
  messageIdShort: string | null;
  messageStatus: string | null;
  error: string | null;
  eligibility: WhatsAppE2EEligibility;
  recipientMasked: string;
  correlationId: string;
  auditId: string;
  note: string;
}> {
  const eligibility = getWhatsAppE2EEligibility();
  const correlationId =
    input.correlationId?.trim()
    || createHash("sha1").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 12);
  const auditId = createHash("sha1")
    .update(`e2e-${correlationId}-${input.adminUserId}`)
    .digest("hex")
    .slice(0, 12);
  const auth = isRecipientAuthorizedForE2E(input.recipientRaw);
  const recipientMasked = auth.recipient
    ? maskWhatsAppRecipientSafe(auth.recipient)
    : maskWhatsAppRecipientSafe(input.recipientRaw);
  const previewChars = input.messageBody.trim().length;

  const refuse = (error: string, note: string) => {
    pushAudit({
      auditId,
      at: new Date().toISOString(),
      adminUserId: input.adminUserId,
      mode: input.mode,
      recipientMasked,
      authorized: auth.authorized,
      confirmed: Boolean(input.confirm),
      accepted: false,
      messageIdShort: null,
      messageStatus: null,
      error,
      correlationId,
      previewChars,
    });
    return {
      ok: false,
      mode: input.mode,
      authorized: auth.authorized,
      accepted: false,
      messageIdShort: null,
      messageStatus: null,
      error,
      eligibility,
      recipientMasked,
      correlationId,
      auditId,
      note,
    };
  };

  if (!input.messageBody.trim()) {
    return refuse("empty_message", "Message preview is empty.");
  }
  if (!auth.authorized || !auth.recipient) {
    return refuse(auth.reason, "Recipient is not on the configured E2E allowlist.");
  }
  if (!input.confirm) {
    return refuse("confirmation_required", "Explicit confirm=true is required for any send.");
  }

  if (input.mode === "mock") {
    const fakeId = `mock_${auditId}`;
    pushAudit({
      auditId,
      at: new Date().toISOString(),
      adminUserId: input.adminUserId,
      mode: "mock",
      recipientMasked,
      authorized: true,
      confirmed: true,
      accepted: true,
      messageIdShort: shortenMessageId(fakeId),
      messageStatus: "mock_accepted",
      error: null,
      correlationId,
      previewChars,
    });
    return {
      ok: true,
      mode: "mock",
      authorized: true,
      accepted: true,
      messageIdShort: shortenMessageId(fakeId),
      messageStatus: "mock_accepted",
      error: null,
      eligibility,
      recipientMasked,
      correlationId,
      auditId,
      note: "Mock only — no Meta API call was made. API accepted ≠ delivered.",
    };
  }

  // Live path
  if (!eligibility.liveSendAllowed) {
    return refuse("live_send_disabled", eligibility.reason);
  }
  const now = Date.now();
  if (now - lastLiveSendAtMs < LIVE_SEND_COOLDOWN_MS) {
    return refuse(
      "rate_limited",
      `Live E2E send cooldown active (${Math.ceil((LIVE_SEND_COOLDOWN_MS - (now - lastLiveSendAtMs)) / 1000)}s).`,
    );
  }

  try {
    // National 10-digit for service helpers that expect India national format.
    const national =
      auth.recipient.startsWith("91") && auth.recipient.length === 12
        ? auth.recipient.slice(2)
        : auth.recipient;
    const result = await whatsAppService.sendSessionTextMessage(
      national,
      input.messageBody.trim().slice(0, 3_900),
    );
    lastLiveSendAtMs = Date.now();
    pushAudit({
      auditId,
      at: new Date().toISOString(),
      adminUserId: input.adminUserId,
      mode: "live",
      recipientMasked,
      authorized: true,
      confirmed: true,
      accepted: Boolean(result.messageId),
      messageIdShort: shortenMessageId(result.messageId),
      messageStatus: result.messageStatus || "accepted",
      error: null,
      correlationId,
      previewChars,
    });
    console.info(
      `[website-knowledge] whatsapp_e2e_live correlationId=${correlationId} auditId=${auditId} accepted=${Boolean(result.messageId)} status=${result.messageStatus || "accepted"} to=${recipientMasked}`,
    );
    return {
      ok: Boolean(result.messageId),
      mode: "live",
      authorized: true,
      accepted: Boolean(result.messageId),
      messageIdShort: shortenMessageId(result.messageId),
      messageStatus: result.messageStatus || "accepted",
      error: null,
      eligibility,
      recipientMasked,
      correlationId,
      auditId,
      note: "Meta API accepted this request. Delivered/read status requires webhook updates and is not implied.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "meta_send_failed";
    pushAudit({
      auditId,
      at: new Date().toISOString(),
      adminUserId: input.adminUserId,
      mode: "live",
      recipientMasked,
      authorized: true,
      confirmed: true,
      accepted: false,
      messageIdShort: null,
      messageStatus: "failed",
      error: message.slice(0, 200),
      correlationId,
      previewChars,
    });
    return {
      ok: false,
      mode: "live",
      authorized: true,
      accepted: false,
      messageIdShort: null,
      messageStatus: "failed",
      error: message.slice(0, 200),
      eligibility,
      recipientMasked,
      correlationId,
      auditId,
      note: "Live Meta send failed. No delivery assumed.",
    };
  }
}
