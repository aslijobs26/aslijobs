/** Thread cap for one Messages export; narrower filters are required above it. */
export const MESSAGES_EXPORT_MAX_THREADS = 2_000;

/** Notification row cap for one Messages export. */
export const MESSAGES_EXPORT_MAX_ROWS = 10_000;

export const MESSAGES_EXPORT_COLUMNS = [
  "Date (IST)",
  "Thread",
  "Candidate",
  "Job Title",
  "Job ID",
  "Application Status",
  "Category",
  "Event",
  "Title",
  "Message",
  "Read Status",
] as const;

export type MessagesExportRow = {
  createdAt: Date;
  threadType: "application" | "job";
  candidateName: string;
  jobTitle: string;
  publicJobId: string;
  applicationStatus: string;
  category: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
};

/** RFC-4180 cell; neutralises spreadsheet formula injection. */
export function escapeMessagesCsvCell(value: string): string {
  let next = value;
  if (/^[=+\-@\t\r]/.test(next)) {
    next = `'${next}`;
  }
  if (/[",\n\r]/.test(next)) {
    return `"${next.replace(/"/g, '""')}"`;
  }
  return next;
}

export function formatMessagesExportDate(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  const hour = part("hour") === "24" ? "00" : part("hour");
  return `${part("year")}-${part("month")}-${part("day")} ${hour}:${part("minute")}`;
}

function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ").trim();
  return spaced ? spaced[0]!.toUpperCase() + spaced.slice(1) : "";
}

export function buildMessagesExportCsv(
  rows: ReadonlyArray<MessagesExportRow>,
  statusLabel: (status: string) => string,
): string {
  const header = MESSAGES_EXPORT_COLUMNS.map(escapeMessagesCsvCell).join(",");
  const lines = rows.map((row) =>
    [
      formatMessagesExportDate(row.createdAt),
      row.threadType === "job" ? "Operations" : "Application",
      row.threadType === "job" ? "Operations" : row.candidateName,
      row.jobTitle,
      row.publicJobId,
      row.threadType === "job" ? "" : statusLabel(row.applicationStatus),
      humanize(row.category),
      humanize(row.type),
      row.title,
      row.body,
      row.isRead ? "Read" : "Unread",
    ]
      .map((cell) => escapeMessagesCsvCell(cell ?? ""))
      .join(","),
  );
  return `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
}

export function buildMessagesExportFileName(now: Date = new Date()): string {
  return `Messages_History_${now.toISOString().slice(0, 10)}.csv`;
}
