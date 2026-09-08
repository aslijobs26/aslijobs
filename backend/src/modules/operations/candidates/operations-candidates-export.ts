import ExcelJS from "exceljs";
import type { OperationsCandidateListItem } from "./operations-candidates.types.js";

export type OperationsCandidatesExportFormat = "xlsx" | "csv";

export type OperationsCandidateExportColumnId =
  | "candidateId"
  | "candidateName"
  | "phone"
  | "preferredRoles"
  | "experience"
  | "location"
  | "registeredOn"
  | "profileStatus"
  | "applications"
  | "lastActive"
  | "whatsappVerified";

export interface OperationsCandidatesExportFileResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

export interface OperationsCandidateExportColumnFlags {
  includeName: boolean;
  includePhone: boolean;
  includeLocation: boolean;
}

interface ColumnDef {
  id: OperationsCandidateExportColumnId;
  header: string;
  minWidth: number;
  maxWidth: number;
  align: "left" | "center" | "right";
  wrap: boolean;
  asText: boolean;
  asNumber: boolean;
}

const COLUMNS: ColumnDef[] = [
  {
    id: "candidateId",
    header: "Candidate ID",
    minWidth: 14,
    maxWidth: 18,
    align: "left",
    wrap: false,
    asText: true,
    asNumber: false,
  },
  {
    id: "candidateName",
    header: "Candidate Name",
    minWidth: 20,
    maxWidth: 36,
    align: "left",
    wrap: true,
    asText: true,
    asNumber: false,
  },
  {
    id: "phone",
    header: "Phone",
    minWidth: 16,
    maxWidth: 20,
    align: "left",
    wrap: false,
    asText: true,
    asNumber: false,
  },
  {
    id: "preferredRoles",
    header: "Preferred Roles",
    minWidth: 20,
    maxWidth: 36,
    align: "left",
    wrap: true,
    asText: true,
    asNumber: false,
  },
  {
    id: "experience",
    header: "Experience",
    minWidth: 14,
    maxWidth: 22,
    align: "left",
    wrap: true,
    asText: true,
    asNumber: false,
  },
  {
    id: "location",
    header: "Location",
    minWidth: 18,
    maxWidth: 32,
    align: "left",
    wrap: true,
    asText: true,
    asNumber: false,
  },
  {
    id: "registeredOn",
    header: "Registered On",
    minWidth: 16,
    maxWidth: 18,
    align: "center",
    wrap: false,
    asText: true,
    asNumber: false,
  },
  {
    id: "profileStatus",
    header: "Profile Status",
    minWidth: 14,
    maxWidth: 18,
    align: "center",
    wrap: false,
    asText: true,
    asNumber: false,
  },
  {
    id: "applications",
    header: "Applications",
    minWidth: 12,
    maxWidth: 15,
    align: "center",
    wrap: false,
    asText: false,
    asNumber: true,
  },
  {
    id: "lastActive",
    header: "Last Active",
    minWidth: 16,
    maxWidth: 18,
    align: "center",
    wrap: false,
    asText: true,
    asNumber: false,
  },
  {
    id: "whatsappVerified",
    header: "WhatsApp Verified",
    minWidth: 16,
    maxWidth: 18,
    align: "center",
    wrap: false,
    asText: true,
    asNumber: false,
  },
];

const EMPTY = "—";
const HEADER_FILL = "0E8585";
const ZEBRA_FILL = "F3F7F7";
const BORDER_COLOR = "D1D5DB";
const HEADER_FONT = "FFFFFFFF";
const BODY_FONT = "1A2B3C";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = {
    style: "thin",
    color: { argb: `FF${BORDER_COLOR}` },
  };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

function displayOrEmpty(value: unknown): string {
  if (value == null) return EMPTY;
  const next = String(value).trim();
  if (!next || next === "undefined" || next === "null" || next === "NaN") {
    return EMPTY;
  }
  return next;
}

export function formatCandidatesExportDate(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === "") return EMPTY;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const monthNum = Number(
    parts.find((part) => part.type === "month")?.value ?? "0",
  );
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = MONTH_SHORT[monthNum - 1];
  if (!day || !month || !year) return EMPTY;
  return `${day}-${month}-${year}`;
}

function todayStamp(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}${m}${d}`;
}

function resolveColumns(
  flags: OperationsCandidateExportColumnFlags,
): ColumnDef[] {
  return COLUMNS.filter((column) => {
    if (column.id === "candidateName") return flags.includeName;
    if (column.id === "phone") return flags.includePhone;
    if (column.id === "location") return flags.includeLocation;
    return true;
  });
}

function cellString(
  item: OperationsCandidateListItem,
  columnId: OperationsCandidateExportColumnId,
): string {
  switch (columnId) {
    case "candidateId":
      return displayOrEmpty(
        item.displayId ||
          (item.jobSeekerId
            ? `AJ-CAN-${item.jobSeekerId.replace(/[^a-fA-F0-9]/g, "").slice(-8).toUpperCase()}`
            : ""),
      );
    case "candidateName":
      return displayOrEmpty(item.candidateName);
    case "phone":
      return displayOrEmpty(item.candidatePhone);
    case "preferredRoles":
      return displayOrEmpty((item.preferredRoles ?? []).join("; "));
    case "experience":
      return displayOrEmpty(item.candidateExperienceLabel);
    case "location":
      return displayOrEmpty(item.candidateLocation);
    case "registeredOn":
      return formatCandidatesExportDate(item.registeredAt);
    case "profileStatus":
      return displayOrEmpty(item.profileStatusLabel);
    case "applications":
      return String(
        Number.isFinite(item.applicationCount) ? item.applicationCount : 0,
      );
    case "lastActive":
      return formatCandidatesExportDate(item.lastActiveAt);
    case "whatsappVerified":
      return item.isWhatsappVerified ? "Yes" : "No";
    default:
      return EMPTY;
  }
}

function columnWidth(
  column: ColumnDef,
  rows: OperationsCandidateListItem[],
): number {
  const contentMax = Math.max(
    column.header.length,
    ...rows.map((row) => cellString(row, column.id).length),
  );
  return Math.min(column.maxWidth, Math.max(column.minWidth, contentMax + 2));
}

function escapeCsvCell(value: string): string {
  let next = value;
  if (/^[=+\-@]/.test(next) && !/^https?:\/\//i.test(next)) {
    next = `'${next}`;
  }
  if (/[",\n\r]/.test(next)) {
    return `"${next.replace(/"/g, '""')}"`;
  }
  return next;
}

function escapeCsvTextLiteral(value: string): string {
  if (!value || value === EMPTY) {
    return escapeCsvCell(value);
  }
  const escaped = value.replace(/"/g, '""');
  return `"=""${escaped}"""`;
}

async function buildXlsx(
  rows: OperationsCandidateListItem[],
  columns: ColumnDef[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AsliJobs Operations";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Candidates", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.id,
    width: columnWidth(column, rows),
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell, colNumber) => {
    const column = columns[colNumber - 1];
    cell.font = {
      bold: true,
      color: { argb: HEADER_FONT },
      size: 11,
      name: "Calibri",
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: column?.align ?? "left",
      wrapText: true,
    };
    cell.border = thinBorder();
  });

  rows.forEach((item, rowIndex) => {
    const values = columns.map((column) => {
      if (column.asNumber) {
        const n = Number(item.applicationCount);
        return Number.isFinite(n) ? n : 0;
      }
      return cellString(item, column.id);
    });

    const excelRow = sheet.addRow(values);
    excelRow.height = 20;
    const zebra = rowIndex % 2 === 1;

    columns.forEach((column, columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1);
      cell.font = { name: "Calibri", size: 11, color: { argb: BODY_FONT } };
      cell.alignment = {
        vertical: "middle",
        horizontal: column.align,
        wrapText: column.wrap,
      };
      cell.border = thinBorder();
      if (zebra) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: `FF${ZEBRA_FILL}` },
        };
      }

      if (column.asText && !column.asNumber) {
        cell.value = cellString(item, column.id);
        cell.numFmt = "@";
      }

      if (column.asNumber) {
        cell.numFmt = "0";
      }
    });
  });

  if (columns.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, rows.length + 1), column: columns.length },
    };
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function buildCsv(
  rows: OperationsCandidateListItem[],
  columns: ColumnDef[],
): Buffer {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const lines = rows.map((item) =>
    columns
      .map((column) => {
        const value = cellString(item, column.id);
        if (
          column.id === "phone" ||
          column.id === "candidateId" ||
          column.id === "candidateName"
        ) {
          return escapeCsvTextLiteral(value);
        }
        return escapeCsvCell(value);
      })
      .join(","),
  );

  const csv = `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
  return Buffer.from(csv, "utf8");
}

export async function buildOperationsCandidatesExportFile(input: {
  rows: OperationsCandidateListItem[];
  format: OperationsCandidatesExportFormat;
  columnFlags: OperationsCandidateExportColumnFlags;
}): Promise<OperationsCandidatesExportFileResult> {
  const columns = resolveColumns(input.columnFlags);
  const stamp = todayStamp();

  if (input.format === "csv") {
    return {
      buffer: buildCsv(input.rows, columns),
      mimeType: "text/csv; charset=utf-8",
      fileName: `AsliJobs-Operations-Candidates-${stamp}.csv`,
    };
  }

  const buffer = await buildXlsx(input.rows, columns);
  return {
    buffer,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: `AsliJobs-Operations-Candidates-${stamp}.xlsx`,
  };
}
