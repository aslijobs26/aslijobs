import { env } from "../../../config/env.js";
import { WHATSAPP_VERIFICATION_CODE_SENT } from "./whatsapp-inbox-redaction.js";

export type WhatsAppTemplateComponent = {
  type?: string;
  text?: string;
  buttons?: Array<{ text?: string }>;
};

const NOTIFICATION_PLACEHOLDER =
  /^WhatsApp notification sent \(([^)]+)\)\.?$/;

let catalogTask: Promise<Map<string, string>> | null = null;

export function notificationPlaceholderTemplateName(body: string): string | null {
  const match = NOTIFICATION_PLACEHOLDER.exec(body.trim());
  return match?.[1]?.trim() || null;
}

export const HISTORICAL_TEMPLATE_DETAILS_UNAVAILABLE =
  "Historical template details unavailable";

const MISSING_PARAMETER = "\u0000";

function placeholderPattern(): RegExp {
  return /\{\{\s*(\d+)\s*\}\}/g;
}

function hasUnresolvedPlaceholder(text: string): boolean {
  return /\{\{\s*\d+\s*\}\}/.test(text);
}

export function fillWhatsAppTemplateParameters(
  templateText: string,
  bodyParameters: readonly string[],
): string {
  return templateText.replace(placeholderPattern(), (token, index) => {
    const value = bodyParameters[Number(index) - 1];
    if (value === undefined || value.trim() === "") return token;
    return value;
  });
}

export type WhatsAppTemplateRender = {
  text: string;
  complete: boolean;
  missingParameters: number[];
};

/**
 * One renderer for persistence and preview. Filled values are kept exactly,
 * including characters that look like placeholders. A missing slot is reported
 * and is never left in the text as {{n}}.
 */
export function renderWhatsAppTemplateMessage(input: {
  templateText: string;
  bodyParameters: readonly string[];
  templateName: string;
}): WhatsAppTemplateRender {
  const missingParameters: number[] = [];
  const filled = input.templateText.replace(placeholderPattern(), (_token, index) => {
    const slot = Number(index);
    const value = input.bodyParameters[slot - 1];
    if (value === undefined || value.trim() === "") {
      if (!missingParameters.includes(slot)) missingParameters.push(slot);
      return MISSING_PARAMETER;
    }
    return value;
  });
  if (missingParameters.length === 0) {
    return { text: filled, complete: true, missingParameters };
  }
  const name = input.templateName.trim();
  if (input.bodyParameters.every((value) => value.trim() === "")) {
    return {
      text: name
        ? `${HISTORICAL_TEMPLATE_DETAILS_UNAVAILABLE} (${name}).`
        : `${HISTORICAL_TEMPLATE_DETAILS_UNAVAILABLE}.`,
      complete: false,
      missingParameters,
    };
  }
  return {
    text: filled.replaceAll(MISSING_PARAMETER, "unavailable"),
    complete: false,
    missingParameters,
  };
}

export function presentWhatsAppTemplateText(input: {
  templateText: string;
  bodyParameters: readonly string[];
  templateName: string;
}): string {
  return renderWhatsAppTemplateMessage(input).text;
}

export function isUnresolvedInboxTemplateBody(body: string): boolean {
  const text = body.trim();
  return (
    text.startsWith(HISTORICAL_TEMPLATE_DETAILS_UNAVAILABLE) ||
    hasUnresolvedPlaceholder(text) ||
    NOTIFICATION_PLACEHOLDER.test(text)
  );
}

/**
 * Keeps a stored message unless a later render recovered the real text.
 * Duplicate webhooks therefore do not create a second body.
 */
export function inboxBodyReplacement(
  existingBody: string,
  nextBody: string,
): "keep" | "replace" {
  const next = nextBody.trim();
  if (!next || isUnresolvedInboxTemplateBody(next)) return "keep";
  if (!isUnresolvedInboxTemplateBody(existingBody)) return "keep";
  if (existingBody.trim() === next) return "keep";
  return "replace";
}

export function composeWhatsAppTemplateText(
  components: readonly WhatsAppTemplateComponent[],
  bodyParameters: readonly string[] = [],
): string {
  const parts: string[] = [];
  for (const component of components) {
    const type = component.type?.trim().toUpperCase() ?? "";
    if (type === "HEADER" || type === "BODY" || type === "FOOTER") {
      const text = component.text?.trim() ?? "";
      if (text) parts.push(fillWhatsAppTemplateParameters(text, bodyParameters));
    }
    if (type === "BUTTONS") {
      for (const button of component.buttons ?? []) {
        const text = button.text?.trim() ?? "";
        if (text) parts.push(text);
      }
    }
  }
  return parts.join("\n").trim();
}

export function lookupWhatsAppTemplateText(
  catalog: ReadonlyMap<string, string>,
  templateName: string,
  language: string,
): string {
  const name = templateName.trim();
  const languageCode = language.trim();
  if (!name) return "";
  const exact = catalog.get(catalogKey(name, languageCode));
  if (exact) return exact;
  const english = catalog.get(catalogKey(name, "en")) || catalog.get(catalogKey(name, "en_US"));
  if (english) return english;
  const matches = [...catalog.entries()].filter(([key]) => key.startsWith(`${name}:`));
  return matches.length === 1 ? matches[0]?.[1] ?? "" : "";
}

export function loadApprovedWhatsAppTemplateCatalog(): Promise<Map<string, string>> {
  if (!catalogTask) {
    catalogTask = fetchApprovedWhatsAppTemplateCatalog().catch((error: unknown) => {
      catalogTask = null;
      throw error;
    });
  }
  return catalogTask;
}

export async function notificationInboxText(input: {
  templateName: string;
  language?: string;
  bodyParameters?: readonly string[];
}): Promise<string> {
  const templateName = input.templateName.trim();
  const fallback = `WhatsApp notification sent (${templateName}).`;
  if (!templateName || isOtpTemplate(templateName)) {
    return isOtpTemplate(templateName) ? WHATSAPP_VERIFICATION_CODE_SENT : fallback;
  }

  try {
    const catalog = await loadApprovedWhatsAppTemplateCatalog();
    const template = lookupWhatsAppTemplateText(
      catalog,
      templateName,
      input.language?.trim() || "en",
    );
    if (!template) return fallback;
    const rendered = renderWhatsAppTemplateMessage({
      templateText: template,
      bodyParameters: input.bodyParameters ?? [],
      templateName,
    });
    const provided = (input.bodyParameters ?? []).some((value) => value.trim());
    if (rendered.missingParameters.length > 0 && provided) {
      console.error(
        `[WhatsAppInbox] template parameters missing template=${templateName} slots=${rendered.missingParameters.join(",")}`,
      );
    }
    return rendered.text || fallback;
  } catch (error: unknown) {
    console.error(
      `[WhatsAppInbox] template text unavailable reason=${
        error instanceof Error ? error.name : "unknown"
      }`,
    );
    return fallback;
  }
}

function catalogKey(templateName: string, language: string): string {
  return `${templateName}:${language}`;
}

function isOtpTemplate(templateName: string): boolean {
  const otpName = env.WHATSAPP_OTP_TEMPLATE_NAME.trim();
  return Boolean(otpName) && otpName.toLowerCase() === templateName.trim().toLowerCase();
}

async function fetchApprovedWhatsAppTemplateCatalog(): Promise<Map<string, string>> {
  const accountId = env.WHATSAPP_BUSINESS_ACCOUNT_ID.trim();
  const token = env.WHATSAPP_ACCESS_TOKEN.trim();
  const catalog = new Map<string, string>();
  if (!accountId || !token) {
    return catalog;
  }

  const version = env.WHATSAPP_API_VERSION.trim() || "v21.0";
  let after = "";
  for (let page = 0; page < 10; page += 1) {
    const url = new URL(
      `https://graph.facebook.com/${version}/${encodeURIComponent(accountId)}/message_templates`,
    );
    url.searchParams.set("fields", "name,language,status,components");
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error("template_catalog_failed");
    }

    const payload = (await response.json()) as {
      data?: Array<{
        name?: string;
        language?: string;
        status?: string;
        components?: WhatsAppTemplateComponent[];
      }>;
      paging?: { cursors?: { after?: string }; next?: string };
    };

    for (const template of payload.data ?? []) {
      if (template.status && template.status !== "APPROVED") continue;
      const name = template.name?.trim() ?? "";
      const language = template.language?.trim() ?? "";
      const text = composeWhatsAppTemplateText(template.components ?? []);
      if (!name || !language || !text || isOtpTemplate(name)) continue;
      catalog.set(catalogKey(name, language), text);
    }

    const nextAfter = payload.paging?.next ? payload.paging.cursors?.after?.trim() ?? "" : "";
    if (!nextAfter || nextAfter === after) break;
    after = nextAfter;
  }

  return catalog;
}
