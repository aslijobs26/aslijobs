import ExcelJS from "exceljs";
import type { OperationsEmployerListItem } from "./operations-employers.types.js";

export type OperationsEmployersExportFormat = "xlsx" | "csv";

export type OperationsEmployerExportColumnId =
  | "company"
  | "industry"
  | "location"
  | "registrationDate"
  | "verificationStatus"
  | "jobsPosted"
  | "accountStatus"
  | "employerId"
  | "phone"
  | "email";

export interface OperationsEmployersExportFileResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

interface ColumnDef {
  id: OperationsEmployerExportColumnId;
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
    id: "company",
    header: "Company",
    minWidth: 22,
    maxWidth: 36,
    align: "left",
    wrap: true,
    asText: true,
    asNumber: false,
  },
  {
    id: "industry",
    header: "Industry",
    minWidth: 18,
    maxWidth: 30,
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
    id: "registrationDate",
    header: "Registration Date",
    minWidth: 16,
    maxWidth: 18,
    align: "center",
    wrap: false,
    asText: true,
    asNumber: false,
  },
  {
    id: "verificationStatus",
    header: "Verification Status",
    minWidth: 18,
    maxWidth: 22,
    align: "center",
    wrap: false,
    asText: true,
    asNumber: false,
  },
  {
    id: "jobsPosted",
    header: "Jobs Posted",
    minWidth: 12,
    maxWidth: 15,
    align: "center",
    wrap: false,
    asText: false,
    asNumber: true,
  },
  {
    id: "accountStatus",
    header: "Account Status",
    minWidth: 15,
    maxWidth: 18,
    align: "center",
    wrap: false,
    asText: true,
    asNumber: false,
  },
  {
    id: "employerId",
    header: "Employer ID",
    minWidth: 14,
    maxWidth: 18,
    align: "left",
    wrap: false,
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
    id: "email",
    header: "Email",
    minWidth: 28,
    maxWidth: 40,
    align: "left",
    wrap: true,
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

export interface OperationsEmployerExportColumnFlags {
  includeCompany: boolean;
  includeLocation: boolean;
  includePhone: boolean;
  includeEmail: boolean;
}

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

/** DD-MMM-YYYY in Asia/Kolkata. */
export function formatOperationsExportDate(
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
  flags: OperationsEmployerExportColumnFlags,
): ColumnDef[] {
  return COLUMNS.filter((column) => {
    if (column.id === "company") return flags.includeCompany;
    if (column.id === "location") return flags.includeLocation;
    if (column.id === "phone") return flags.includePhone;
    if (column.id === "email") return flags.includeEmail;
    return true;
  });
}

function cellString(
  item: OperationsEmployerListItem,
  columnId: OperationsEmployerExportColumnId,
): string {
  switch (columnId) {
    case "company":
      return displayOrEmpty(item.companyName || item.displayName);
    case "industry":
      return displayOrEmpty(item.industry);
    case "location":
      return displayOrEmpty(item.location);
    case "registrationDate":
      return formatOperationsExportDate(item.registeredAt);
    case "verificationStatus":
      return displayOrEmpty(item.verificationStatusLabel);
    case "jobsPosted":
      return String(
        Number.isFinite(item.totalJobsCount) ? item.totalJobsCount : 0,
      );
    case "accountStatus":
      return displayOrEmpty(item.statusLabel);
    case "employerId":
      return displayOrEmpty(item.displayId);
    case "phone":
      return displayOrEmpty(item.phone);
    case "email":
      return displayOrEmpty(item.email);
    default:
      return EMPTY;
  }
}

function columnWidth(column: ColumnDef, rows: OperationsEmployerListItem[]): number {
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

/**
 * Force Excel to treat phone / ID values as text in CSV (avoids 7.68E+09).
 */
function escapeCsvTextLiteral(value: string): string {
  if (!value || value === EMPTY) {
    return escapeCsvCell(value);
  }
  const escaped = value.replace(/"/g, '""');
  return `"=""${escaped}"""`;
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function buildXlsx(
  rows: OperationsEmployerListItem[],
  columns: ColumnDef[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AsliJobs Operations";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Employers", {
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
        const n = Number(item.totalJobsCount);
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
        const textValue = cellString(item, column.id);
        if (column.id === "email" && textValue !== EMPTY && isLikelyEmail(textValue)) {
          cell.value = {
            text: textValue,
            hyperlink: `mailto:${textValue}`,
          };
          cell.font = {
            name: "Calibri",
            size: 11,
            color: { argb: "FF0563C1" },
            underline: true,
          };
        } else {
          cell.value = textValue;
        }
        // Prevent Excel from coercing phone / IDs into scientific notation.
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
  rows: OperationsEmployerListItem[],
  columns: ColumnDef[],
): Buffer {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const lines = rows.map((item) =>
    columns
      .map((column) => {
        const value = cellString(item, column.id);
        if (
          column.id === "phone" ||
          column.id === "employerId" ||
          column.id === "email"
        ) {
          return escapeCsvTextLiteral(value);
        }
        if (column.asNumber) {
          return escapeCsvCell(value);
        }
        return escapeCsvCell(value);
      })
      .join(","),
  );

  // UTF-8 BOM so Excel preserves Unicode (Telugu / special characters).
  const csv = `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
  return Buffer.from(csv, "utf8");
}

export async function buildOperationsEmployersXlsx(input: {
  rows: OperationsEmployerListItem[];
  columnFlags: OperationsEmployerExportColumnFlags;
}): Promise<OperationsEmployersExportFileResult> {
  const columns = resolveColumns(input.columnFlags);
  const buffer = await buildXlsx(input.rows, columns);
  return {
    buffer,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: `AsliJobs-Operations-Employers-${todayStamp()}.xlsx`,
  };
}

export function buildOperationsEmployersCsv(input: {
  rows: OperationsEmployerListItem[];
  columnFlags: OperationsEmployerExportColumnFlags;
}): OperationsEmployersExportFileResult {
  const columns = resolveColumns(input.columnFlags);
  return {
    buffer: buildCsv(input.rows, columns),
    mimeType: "text/csv; charset=utf-8",
    fileName: `AsliJobs-Operations-Employers-${todayStamp()}.csv`,
  };
}

export async function buildOperationsEmployersExportFile(input: {
  rows: OperationsEmployerListItem[];
  format: OperationsEmployersExportFormat;
  columnFlags: OperationsEmployerExportColumnFlags;
}): Promise<OperationsEmployersExportFileResult> {
  if (input.format === "csv") {
    return buildOperationsEmployersCsv(input);
  }
  return buildOperationsEmployersXlsx(input);
}
