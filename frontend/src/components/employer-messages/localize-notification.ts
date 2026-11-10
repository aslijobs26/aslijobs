import type { SiteLanguageCode } from "@/constants/site-language";
import { translateIfPresent } from "@/i18n/translate";
import type { NotificationTemplate } from "@/types/notifications";

type LocalizableNotification = {
  title: string;
  body: string;
  template?: NotificationTemplate | null;
};

const TEMPLATE_NAMESPACE = "notificationTemplates";
const UNRESOLVED_TOKEN = /\{\w+\}/;

function formatTemplateDate(raw: string, language: SiteLanguageCode): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }
  return new Intl.DateTimeFormat(`${language}-IN`, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/**
 * Translated title/body for a Messages notification, rendered from the
 * server-provided template key + params. Falls back to the stored English
 * text for English, rows recorded before params existed, unknown keys, or
 * any placeholder that cannot be filled. Stored data is never modified.
 */
export function localizeNotification(
  item: LocalizableNotification,
  language: SiteLanguageCode,
): { title: string; body: string } {
  const stored = { title: item.title, body: item.body };
  const template = item.template;
  if (language === "en" || !template?.key || !template.params) {
    return stored;
  }

  const lookup = (key: string, values?: Record<string, string>) =>
    translateIfPresent(language, `${TEMPLATE_NAMESPACE}.${key}`, values);
  const params = template.params;
  const fallback = (name: string) => lookup(`fallback.${name}`) ?? "";

  const detailParts: string[] = [];
  const pushDetail = (label: string, value: string | undefined) => {
    if (value) {
      detailParts.push(`${lookup(`labels.${label}`) ?? label}: ${value}`);
    }
  };
  pushDetail(
    "date",
    params.date ? formatTemplateDate(params.date, language) : undefined,
  );
  pushDetail("time", params.time);
  pushDetail(
    "mode",
    params.mode === "online" || params.mode === "offline"
      ? lookup(`labels.${params.mode}`) ?? params.mode
      : params.mode,
  );
  pushDetail("meetingLink", params.meetingLink);
  pushDetail("venue", params.venue);

  const values: Record<string, string> = {
    candidate: params.candidate ?? fallback("candidate"),
    company: params.company ?? fallback("company"),
    jobTitle: params.jobTitle ?? fallback("jobTitle"),
    reason: params.reason ?? fallback("reason"),
    actor: params.actor ?? fallback("actor"),
    details: detailParts.length > 0 ? `\n${detailParts.join(" · ")}` : "",
    when: params.date
      ? (lookup("scheduledOn", {
          date: formatTemplateDate(params.date, language),
        }) ?? "")
      : "",
  };
  if (params.publicJobId) {
    values.publicJobId = params.publicJobId;
  }

  const title = lookup(`${template.key}.title`, values);
  const body = lookup(`${template.key}.body`, values);
  if (
    !title ||
    !body ||
    UNRESOLVED_TOKEN.test(title) ||
    UNRESOLVED_TOKEN.test(body)
  ) {
    return stored;
  }
  return { title, body };
}
