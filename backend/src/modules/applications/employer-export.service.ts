import ExcelJS from "exceljs";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EmployerModel } from "../employers/employer.model.js";
import { APPLICATION_STATUS_LABELS } from "./application.constants.js";
import { ApplicationModel } from "./application.model.js";
import type {
  ApplicationResumeSnapshot,
  ApplicationStatus,
} from "./application.types.js";
import {
  buildEmployerAvailabilityMatch,
  parseEmployerAvailabilityFilter,
} from "./employer-availability-filter.js";
import { buildEmployerCandidateSearchMatch } from "./employer-candidate-search.js";
import {
  buildEmployerExperienceMatch,
  parseEmployerExperienceFilter,
} from "./employer-experience-filter.js";
import { buildEmployerPreferredLocationMatch } from "./employer-location-filter.js";
import {
  parseEmployerExportQuickDateFilter,
  resolveEmployerExportQuickDateRange,
} from "./employer-export-quick-date.js";
import {
  EMPLOYER_EXPORT_COLUMN_WIDTH,
  EMPLOYER_EXPORT_FIELD_LABELS,
  EMPLOYER_EXPORT_MAX_ROWS,
  EMPLOYER_EXPORT_PDF_COLUMN_WEIGHT,
  EMPLOYER_EXPORT_RESUME_DISPLAY_TEXT,
} from "./employer-export.constants.js";
import type {
  EmployerExportField,
  EmployerExportFileResult,
  EmployerExportFilters,
  EmployerExportPreviewResult,
  EmployerExportRow,
} from "./employer-export.types.js";
import { employerResumeAccessService } from "./employer-resume-access.service.js";

const EXCEL_HEADER_FILL = "0F3D5E";
const EXCEL_ZEBRA_FILL = "F8FAFC";
const EXCEL_BORDER_COLOR = "D1D5DB";
const PDF_HEADER_FILL = "#0F3D5E";
const PDF_ZEBRA_FILL = "#F8FAFC";
const PDF_BORDER = "#D1D5DB";
const PDF_TEXT = "#1A2B3C";
const PDF_MUTED = "#5A6570";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asSnapshot(value: unknown): ApplicationResumeSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const snapshot = value as ApplicationResumeSnapshot;
  if (
    !snapshot.resumeJson ||
    typeof snapshot.resumeJson !== "object" ||
    !("header" in snapshot.resumeJson) ||
    !("sections" in snapshot.resumeJson)
  ) {
    return null;
  }
  return snapshot;
}

function candidateFieldsFromSnapshot(
  snapshot: ApplicationResumeSnapshot | null,
) {
  const header = snapshot?.resumeJson?.header;
  const contact = snapshot?.resumeJson?.sections?.contact;
  const sections = snapshot?.resumeJson?.sections;

  const fullName =
    text(header?.fullName) || text(contact?.fullName) || "Candidate";
  const phone = text(header?.phone) || text(contact?.phone);
  const city = text(header?.city) || text(contact?.city);
  const state = text(header?.state) || text(contact?.state);
  const location =
    [city, state].filter(Boolean).join(", ") || text(header?.location);
  const experienceLabel =
    sections?.isFresher === true
      ? "Fresher"
      : text(sections?.experienceLabel);

  return { fullName, phone, location, experienceLabel };
}

function buildMatchAndFilters(input: EmployerExportFilters): {
  match: Record<string, unknown>;
  andFilters: Record<string, unknown>[];
} {
  const match: Record<string, unknown> = {
    employerId: new mongoose.Types.ObjectId(input.employerId),
  };

  if (input.publicJobId?.trim()) {
    match.publicJobId = input.publicJobId.trim().toUpperCase();
  }

  if (input.status) {
    match.status = input.status;
  }

  const appliedAt: Record<string, Date> = {};
  const quickDate =
    parseEmployerExportQuickDateFilter(input.quickDateFilter) || "all_time";
  const quickRange = resolveEmployerExportQuickDateRange(quickDate);

  if (quickRange) {
    if (quickRange.appliedFrom) {
      appliedAt.$gte = quickRange.appliedFrom;
    }
    if (quickRange.appliedTo) {
      appliedAt.$lte = quickRange.appliedTo;
    }
  } else if (quickDate === "custom") {
    if (input.appliedFrom?.trim()) {
      const from = new Date(input.appliedFrom);
      if (!Number.isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        appliedAt.$gte = from;
      }
    }
    if (input.appliedTo?.trim()) {
      const to = new Date(input.appliedTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        appliedAt.$lte = to;
      }
    }
  }

  if (Object.keys(appliedAt).length > 0) {
    match.appliedAt = appliedAt;
  }

  const andFilters: Record<string, unknown>[] = [];

  const searchMatch = buildEmployerCandidateSearchMatch(input.search);
  if (searchMatch) {
    andFilters.push(searchMatch);
  }

  const locationMatch = buildEmployerPreferredLocationMatch(input.location);
  if (locationMatch) {
    andFilters.push(locationMatch);
  }

  const experienceMatch = buildEmployerExperienceMatch(
    parseEmployerExperienceFilter(input.experience),
  );
  if (experienceMatch) {
    andFilters.push(experienceMatch);
  }

  const skills = text(input.skills);
  if (skills) {
    const skillTerms = skills
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean);
    for (const term of skillTerms) {
      andFilters.push({
        "resumeSnapshot.resumeJson.sections.skills": {
          $elemMatch: {
            $regex: escapeRegex(term),
            $options: "i",
          },
        },
      });
    }
  }

  const availabilityMatch = buildEmployerAvailabilityMatch(
    parseEmployerAvailabilityFilter(input.availability),
  );
  if (availabilityMatch) {
    andFilters.push(availabilityMatch);
  }

  return { match, andFilters };
}

function statusLabel(status: string): string {
  if (status in APPLICATION_STATUS_LABELS) {
    return APPLICATION_STATUS_LABELS[status as ApplicationStatus];
  }
  return status;
}

function formatAppliedDate(value: Date): string {
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function slugifyJobPart(value: string): string {
  const slug = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "Job";
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildFileName(jobLabel: string, extension: string): string {
  return `Candidates_${slugifyJobPart(jobLabel)}_${todayStamp()}.${extension}`;
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = {
    style: "thin",
    color: { argb: `FF${EXCEL_BORDER_COLOR}` },
  };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

function applicationIdOf(value: unknown): string {
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }
  if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "_id" in value &&
    (value as { _id?: unknown })._id
  ) {
    return applicationIdOf((value as { _id: unknown })._id);
  }
  return "";
}

async function loadExportRows(
  input: EmployerExportFilters,
): Promise<{ rows: EmployerExportRow[]; jobLabel: string; companyName: string }> {
  if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  const includeResume = input.fields.includes("resume");
  const { match, andFilters } = buildMatchAndFilters(input);

  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    {
      $unwind: {
        path: "$job",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "jobseekers",
        localField: "jobSeekerId",
        foreignField: "_id",
        as: "jobSeekerDoc",
      },
    },
    {
      $unwind: {
        path: "$jobSeekerDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (andFilters.length > 0) {
    pipeline.push({ $match: { $and: andFilters } });
  }

  pipeline.push({ $sort: { appliedAt: -1 } });
  pipeline.push({
    $facet: {
      items: [{ $limit: EMPLOYER_EXPORT_MAX_ROWS + 1 }],
      totalCount: [{ $count: "count" }],
    },
  });

  const [facet] = await ApplicationModel.aggregate<{
    items: Array<{
      _id: mongoose.Types.ObjectId | string;
      publicJobId: string;
      status: ApplicationStatus | string;
      resumeSnapshot: unknown;
      appliedAt: Date;
      job?: { jobTitle?: string; companyName?: string };
      jobSeekerDoc?: { preferredJobLocation?: string | null };
    }>;
    totalCount: Array<{ count: number }>;
  }>(pipeline);

  const total = facet?.totalCount?.[0]?.count ?? 0;
  if (total === 0) {
    throw new AppError(
      "No candidate data found for the selected filters.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  if (total > EMPLOYER_EXPORT_MAX_ROWS) {
    throw new AppError(
      `Export is limited to ${EMPLOYER_EXPORT_MAX_ROWS} candidates. Narrow your filters and try again.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const rows: EmployerExportRow[] = (facet?.items ?? []).map((app) => {
    const candidate = candidateFieldsFromSnapshot(asSnapshot(app.resumeSnapshot));
    const applicationId = applicationIdOf(app._id);
    const resume =
      includeResume && applicationId
        ? employerResumeAccessService.resolveResumeAccessUrl({
            applicationId,
            employerId: input.employerId,
          })
        : "";

    const preferredLocation = text(app.jobSeekerDoc?.preferredJobLocation);

    return {
      candidateName: candidate.fullName,
      phone: candidate.phone,
      appliedJob: app.job?.jobTitle?.trim() || app.publicJobId || "Job",
      appliedDate: formatAppliedDate(app.appliedAt),
      status: statusLabel(String(app.status)),
      location: preferredLocation || "—",
      experience: candidate.experienceLabel,
      resume,
    };
  });

  let jobLabel = "AllJobs";
  if (input.publicJobId?.trim()) {
    jobLabel =
      rows[0]?.appliedJob?.replace(/\s+/g, "") ||
      input.publicJobId.trim().toUpperCase();
  }

  const employer = await EmployerModel.findById(input.employerId)
    .select("companyName")
    .lean();
  const companyName =
    text(employer?.companyName) ||
    text(facet?.items?.[0]?.job?.companyName) ||
    "AsliJobs Employer";

  return { rows, jobLabel, companyName };
}

function cellValue(row: EmployerExportRow, field: EmployerExportField): string {
  return row[field] ?? "";
}

function excelColumnWidth(
  field: EmployerExportField,
  rows: EmployerExportRow[],
): number {
  const bounds = EMPLOYER_EXPORT_COLUMN_WIDTH[field];
  if (field === "resume") {
    return Math.min(
      bounds.max,
      Math.max(bounds.min, EMPLOYER_EXPORT_RESUME_DISPLAY_TEXT.length + 2),
    );
  }
  const contentMax = Math.max(
    EMPLOYER_EXPORT_FIELD_LABELS[field].length,
    ...rows.map((row) => cellValue(row, field).length),
  );
  return Math.min(bounds.max, Math.max(bounds.min, contentMax + 2));
}

async function buildExcel(
  rows: EmployerExportRow[],
  fields: EmployerExportField[],
  jobLabel: string,
): Promise<EmployerExportFileResult> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AsliJobs";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Candidates", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = fields.map((field) => ({
    header: EMPLOYER_EXPORT_FIELD_LABELS[field],
    key: field,
    width: excelColumnWidth(field, rows),
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${EXCEL_HEADER_FILL}` },
    };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = thinBorder();
  });

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.addRow(
      Object.fromEntries(
        fields.map((field) => {
          if (field === "resume") {
            return [field, ""];
          }
          return [field, cellValue(row, field)];
        }),
      ),
    );
    excelRow.height = 18;
    const zebra = rowIndex % 2 === 1;

    fields.forEach((field, columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1);
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: field === "location",
      };
      cell.border = thinBorder();
      if (zebra) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: `FF${EXCEL_ZEBRA_FILL}` },
        };
      }

      if (field === "resume") {
        const url = cellValue(row, "resume");
        if (url) {
          cell.value = {
            text: EMPLOYER_EXPORT_RESUME_DISPLAY_TEXT,
            hyperlink: url,
          };
          cell.font = {
            color: { argb: "FF0563C1" },
            underline: true,
          };
        } else {
          cell.value = "";
        }
      }
    });
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: fields.length },
  };

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    buffer,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: buildFileName(jobLabel, "xlsx"),
  };
}

function escapeCsvCell(value: string): string {
  let next = value;
  // Prevent spreadsheet formula injection for non-URL values.
  if (/^[=+\-@]/.test(next) && !/^https?:\/\//i.test(next)) {
    next = `'${next}`;
  }
  if (/[",\n\r]/.test(next)) {
    return `"${next.replace(/"/g, '""')}"`;
  }
  return next;
}

/**
 * RFC-4180 CSV. Resume column uses the full signed URL because plain CSV has
 * no native hyperlink display-text (Excel keeps "View Resume" clickable text).
 */
function buildCsv(
  rows: EmployerExportRow[],
  fields: EmployerExportField[],
  jobLabel: string,
): EmployerExportFileResult {
  const header = fields
    .map((field) => escapeCsvCell(EMPLOYER_EXPORT_FIELD_LABELS[field]))
    .join(",");
  const lines = rows.map((row) =>
    fields.map((field) => escapeCsvCell(cellValue(row, field))).join(","),
  );
  const csv = `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
  return {
    buffer: Buffer.from(csv, "utf8"),
    mimeType: "text/csv; charset=utf-8",
    fileName: buildFileName(jobLabel, "csv"),
  };
}

function buildFiltersSummary(input: EmployerExportFilters): string[] {
  const lines: string[] = [];
  const job = text(input.publicJobId);
  lines.push(`Job: ${job || "All Jobs"}`);

  const range = dateRangeLabel(input);
  if (range) {
    lines.push(`Date range: ${range}`);
  }

  if (input.status) {
    lines.push(`Status: ${statusLabel(input.status)}`);
  }
  if (text(input.search)) {
    lines.push(`Search: ${text(input.search)}`);
  }
  if (text(input.location)) {
    lines.push(`Location: ${text(input.location)}`);
  }
  if (text(input.experience)) {
    lines.push(`Experience: ${text(input.experience)}`);
  }
  if (text(input.skills)) {
    lines.push(`Skills: ${text(input.skills)}`);
  }
  if (text(input.availability)) {
    lines.push(`Availability: ${text(input.availability)}`);
  }

  return lines;
}

function pdfColumnWidths(
  fields: EmployerExportField[],
  pageWidth: number,
): number[] {
  const weights = fields.map(
    (field) => EMPLOYER_EXPORT_PDF_COLUMN_WEIGHT[field] ?? 1,
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  return weights.map((weight) => (weight / total) * pageWidth);
}

async function buildPdf(
  rows: EmployerExportRow[],
  fields: EmployerExportField[],
  jobLabel: string,
  companyName: string,
  filters: EmployerExportFilters,
): Promise<EmployerExportFileResult> {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 36,
    bufferPages: true,
    info: {
      Title: "AsliJobs Candidates Export",
      Author: companyName,
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;
  const colWidths = pdfColumnWidths(fields, pageWidth);
  const headerBandHeight = 20;
  const footerReserve = 36;

  doc.fontSize(16).font("Helvetica-Bold").fillColor(PDF_TEXT).text(companyName);
  doc.moveDown(0.25);
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor(PDF_TEXT)
    .text("Candidates Export");
  doc.moveDown(0.35);
  doc.fontSize(9).font("Helvetica").fillColor(PDF_MUTED);
  doc.text(`Export date: ${formatAppliedDate(new Date())}`);
  doc.text(`Job: ${jobLabel === "AllJobs" ? "All Jobs" : jobLabel}`);
  for (const line of buildFiltersSummary(filters)) {
    if (line.startsWith("Job:")) {
      continue;
    }
    doc.text(line);
  }
  doc.text(`Candidate count: ${rows.length}`);
  doc.moveDown(0.55);

  let y = doc.y;

  const drawTableHeader = () => {
    doc.save();
    doc.rect(startX, y, pageWidth, headerBandHeight).fill(PDF_HEADER_FILL);
    doc.restore();

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF");
    let x = startX;
    fields.forEach((field, index) => {
      const width = colWidths[index] ?? 40;
      doc.text(EMPLOYER_EXPORT_FIELD_LABELS[field], x + 3, y + 5, {
        width: width - 6,
        height: headerBandHeight - 6,
        ellipsis: true,
      });
      x += width;
    });
    y += headerBandHeight;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed <= doc.page.height - doc.page.margins.bottom - footerReserve) {
      return;
    }
    doc.addPage();
    y = doc.page.margins.top;
    drawTableHeader();
  };

  drawTableHeader();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]!;
    const displayValues = fields.map((field) => {
      if (field === "resume") {
        return cellValue(row, field) ? EMPLOYER_EXPORT_RESUME_DISPLAY_TEXT : "—";
      }
      return cellValue(row, field) || "—";
    });

    doc.font("Helvetica").fontSize(7.5);
    const rowHeight = Math.max(
      16,
      ...displayValues.map((value, index) =>
        doc.heightOfString(value, {
          width: (colWidths[index] ?? 40) - 6,
        }),
      ),
      16,
    );

    ensureSpace(rowHeight);

    if (rowIndex % 2 === 1) {
      doc.save();
      doc.rect(startX, y, pageWidth, rowHeight).fill(PDF_ZEBRA_FILL);
      doc.restore();
    }

    doc.save();
    doc.lineWidth(0.5).strokeColor(PDF_BORDER);
    doc.rect(startX, y, pageWidth, rowHeight).stroke();
    let gridX = startX;
    for (let i = 0; i < fields.length - 1; i += 1) {
      gridX += colWidths[i] ?? 0;
      doc
        .moveTo(gridX, y)
        .lineTo(gridX, y + rowHeight)
        .stroke();
    }
    doc.restore();

    let x = startX;
    fields.forEach((field, index) => {
      const width = colWidths[index] ?? 40;
      const raw = cellValue(row, field);
      const display = displayValues[index] ?? "—";

      if (field === "resume" && raw) {
        doc
          .fillColor("#0563C1")
          .font("Helvetica")
          .fontSize(7.5)
          .text(EMPLOYER_EXPORT_RESUME_DISPLAY_TEXT, x + 3, y + 4, {
            width: width - 6,
            height: rowHeight - 6,
            ellipsis: true,
            link: raw,
            underline: true,
          });
      } else {
        doc
          .fillColor(PDF_TEXT)
          .font("Helvetica")
          .fontSize(7.5)
          .text(display, x + 3, y + 4, {
            width: width - 6,
            height: rowHeight - 6,
            ellipsis: true,
          });
      }
      x += width;
    });

    y += rowHeight;
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor(PDF_MUTED)
      .font("Helvetica")
      .text(
        `Generated by AsliJobs  ·  Page ${i - range.start + 1} of ${range.count}`,
        doc.page.margins.left,
        doc.page.height - 28,
        { width: pageWidth, align: "center" },
      );
  }

  doc.end();
  const buffer = await done;

  return {
    buffer,
    mimeType: "application/pdf",
    fileName: buildFileName(jobLabel, "pdf"),
  };
}

function dateRangeLabel(input: EmployerExportFilters): string {
  const quickDate =
    parseEmployerExportQuickDateFilter(input.quickDateFilter) || "all_time";
  if (quickDate !== "all_time" && quickDate !== "custom") {
    const labels: Record<string, string> = {
      today: "Today",
      yesterday: "Yesterday",
      last_7_days: "Last 7 Days",
      last_30_days: "Last 30 Days",
      this_month: "This Month",
      last_month: "Last Month",
    };
    return labels[quickDate] ?? quickDate;
  }

  const from = text(input.appliedFrom);
  const to = text(input.appliedTo);
  if (!from && !to) {
    return "";
  }
  if (from && to) {
    return `${from} – ${to}`;
  }
  if (from) {
    return `From ${from}`;
  }
  return `Until ${to}`;
}

export class EmployerExportService {
  async preview(
    input: EmployerExportFilters,
  ): Promise<EmployerExportPreviewResult> {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { match, andFilters } = buildMatchAndFilters(input);
    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: {
          path: "$job",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "jobseekers",
          localField: "jobSeekerId",
          foreignField: "_id",
          as: "jobSeekerDoc",
        },
      },
      {
        $unwind: {
          path: "$jobSeekerDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
    if (andFilters.length > 0) {
      pipeline.push({ $match: { $and: andFilters } });
    }
    pipeline.push({ $count: "count" });

    const [row] = await ApplicationModel.aggregate<{ count: number }>(pipeline);
    return { total: row?.count ?? 0 };
  }

  async export(input: EmployerExportFilters): Promise<EmployerExportFileResult> {
    const { rows, jobLabel, companyName } = await loadExportRows(input);
    const fields = input.fields;

    if (input.format === "xlsx") {
      return buildExcel(rows, fields, jobLabel);
    }
    if (input.format === "csv") {
      return buildCsv(rows, fields, jobLabel);
    }
    return buildPdf(rows, fields, jobLabel, companyName, input);
  }
}

export const employerExportService = new EmployerExportService();
