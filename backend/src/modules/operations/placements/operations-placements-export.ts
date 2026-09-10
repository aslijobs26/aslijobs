import ExcelJS from "exceljs";
import type { OperationsPlacementListItem } from "./operations-placements.types.js";

export type OperationsPlacementsExportFormat = "xlsx" | "csv";

export type OperationsPlacementExportColumnId =
  | "name"
  | "jobRole"
  | "company"
  | "location"
  | "offerDate"
  | "joiningDate"
  | "status";

export interface OperationsPlacementsExportFileResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

interface ColumnDef {
  id: OperationsPlacementExportColumnId;
  header: string;
  minWidth: number;
  maxWidth: number;
  align: "left" | "center" | "right";
  wrap: boolean;
  asText: boolean;
}

const COLUMNS: ColumnDef[] = [
  {
    id: "name",
    header: "Name",
    minWidth: 20,
    maxWidth: 36,
    align: "left",
    wrap: true,
    asText: true,
  },
  {
    id: "jobRole",
    header: "Job Role",
    minWidth: 18,
    maxWidth: 32,
    align: "left",
    wrap: true,
    asText: true,
  },
  {
    id: "company",
    header: "Company",
    minWidth: 18,
    maxWidth: 32,
    align: "left",
    wrap: true,
    asText: true,
  },
  {
    id: "location",
    header: "Location",
    minWidth: 18,
    maxWidth: 32,
    align: "left",
    wrap: true,
    asText: true,
  },
  {
    id: "offerDate",
    header: "Offer Date",
    minWidth: 14,
    maxWidth: 18,
    align: "center",
    wrap: false,
    asText: true,
  },
  {
    id: "joiningDate",
    header: "Joining Date",
    minWidth: 14,
    maxWidth: 18,
    align: "center",
    wrap: false,
    asText: true,
  },
  {
    id: "status",
    header: "Status",
    minWidth: 14,
    maxWidth: 20,
    align: "center",
    wrap: false,
    asText: true,
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

export function formatPlacementsExportDate(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === "") return EMPTY;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    // Already a display-friendly string (e.g. YYYY-MM-DD stored as offer date).
    const asText = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(asText)) {
      const parsed = new Date(`${asText.slice(0, 10)}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return formatPlacementsExportDate(parsed);
      }
    }
    return displayOrEmpty(value);
  }

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

function cellString(
  item: OperationsPlacementListItem,
  columnId: OperationsPlacementExportColumnId,
): string {
  switch (columnId) {
    case "name":
      return displayOrEmpty(item.candidateName);
    case "jobRole":
      return displayOrEmpty(item.jobRole);
    case "company":
      return displayOrEmpty(item.company);
    case "location":
      return displayOrEmpty(item.location);
    case "offerDate":
      return formatPlacementsExportDate(item.offerDate);
    case "joiningDate":
      return formatPlacementsExportDate(item.joiningDate);
    case "status":
      return displayOrEmpty(item.statusLabel);
    default:
      return EMPTY;
  }
}

function columnWidth(
  column: ColumnDef,
  rows: OperationsPlacementListItem[],
): number {
  const contentMax = Math.max(
    column.header.length,
    ...rows.map((row) => cellString(row, column.id).length),
  );
  return Math.min(column.maxWidth, Math.max(column.minWidth, contentMax + 2));
}

/** Escape CSV cells and neutralize formula injection (=, +, -, @). */
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
  rows: OperationsPlacementListItem[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AsliJobs Operations";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Placements", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  sheet.columns = COLUMNS.map((column) => ({
    header: column.header,
    key: column.id,
    width: columnWidth(column, rows),
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell, colNumber) => {
    const column = COLUMNS[colNumber - 1];
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
    const values = COLUMNS.map((column) => cellString(item, column.id));
    const excelRow = sheet.addRow(values);
    excelRow.height = 20;
    const zebra = rowIndex % 2 === 1;

    COLUMNS.forEach((column, columnIndex) => {
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
      if (column.asText) {
        cell.value = cellString(item, column.id);
        cell.numFmt = "@";
      }
    });
  });

  if (COLUMNS.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, rows.length + 1), column: COLUMNS.length },
    };
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function buildCsv(rows: OperationsPlacementListItem[]): Buffer {
  const header = COLUMNS.map((column) => escapeCsvCell(column.header)).join(
    ",",
  );
  const lines = rows.map((item) =>
    COLUMNS.map((column) => {
      const value = cellString(item, column.id);
      if (
        column.id === "name" ||
        column.id === "jobRole" ||
        column.id === "company"
      ) {
        return escapeCsvTextLiteral(value);
      }
      return escapeCsvCell(value);
    }).join(","),
  );

  const csv = `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
  return Buffer.from(csv, "utf8");
}

export async function buildOperationsPlacementsExportFile(input: {
  rows: OperationsPlacementListItem[];
  format: OperationsPlacementsExportFormat;
}): Promise<OperationsPlacementsExportFileResult> {
  const stamp = todayStamp();

  if (input.format === "csv") {
    return {
      buffer: buildCsv(input.rows),
      mimeType: "text/csv; charset=utf-8",
      fileName: `AsliJobs-Operations-Placements-${stamp}.csv`,
    };
  }

  const buffer = await buildXlsx(input.rows);
  return {
    buffer,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: `AsliJobs-Operations-Placements-${stamp}.xlsx`,
  };
}
