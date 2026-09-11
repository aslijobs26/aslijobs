import ExcelJS from "exceljs";
import type { OperationsWorkListItem } from "./operations-work.types.js";

export type OperationsWorkExportFormat = "xlsx" | "csv";

export interface OperationsWorkExportFileResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

const COLUMNS = [
  { id: "displayId", header: "Work ID", width: 18 },
  { id: "title", header: "Title", width: 36 },
  { id: "typeLabel", header: "Type", width: 18 },
  { id: "priority", header: "Priority", width: 10 },
  { id: "statusLabel", header: "Status", width: 14 },
  { id: "relatedLabel", header: "Related To", width: 28 },
  { id: "relatedLocationLabel", header: "Location", width: 24 },
  { id: "assignedToName", header: "Assignee", width: 22 },
  { id: "dueAt", header: "Due At", width: 22 },
  { id: "completedAt", header: "Completed At", width: 22 },
  { id: "createdAt", header: "Created At", width: 22 },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

function cellValue(item: OperationsWorkListItem, id: ColumnId): string {
  const raw = item[id];
  if (raw == null) return "";
  return String(raw);
}

function stamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function buildOperationsWorkExportFile(input: {
  items: OperationsWorkListItem[];
  format: OperationsWorkExportFormat;
}): Promise<OperationsWorkExportFileResult> {
  const fileName = `AsliJobs-Operations-MyWork-${stamp()}.${input.format}`;

  if (input.format === "csv") {
    const header = COLUMNS.map((c) => c.header).join(",");
    const rows = input.items.map((item) =>
      COLUMNS.map((column) => {
        const value = cellValue(item, column.id).replace(/"/g, '""');
        return `"${value}"`;
      }).join(","),
    );
    const csv = `\uFEFF${[header, ...rows].join("\n")}`;
    return {
      buffer: Buffer.from(csv, "utf8"),
      mimeType: "text/csv; charset=utf-8",
      fileName,
    };
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AsliJobs Operations";
  const sheet = workbook.addWorksheet("My Work");
  sheet.columns = COLUMNS.map((column) => ({
    header: column.header,
    key: column.id,
    width: column.width,
  }));
  for (const item of input.items) {
    const row: Record<string, string> = {};
    for (const column of COLUMNS) {
      row[column.id] = cellValue(item, column.id);
    }
    sheet.addRow(row);
  }
  sheet.getRow(1).font = { bold: true };

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    buffer,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName,
  };
}
