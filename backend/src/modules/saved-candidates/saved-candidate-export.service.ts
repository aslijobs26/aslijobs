import ExcelJS from "exceljs";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { buildZipStoreBuffer } from "../../utils/zip-store.js";
import { applicationService } from "../applications/application.service.js";
import { employerResumeAccessService } from "../applications/employer-resume-access.service.js";
import { EmployerModel } from "../employers/employer.model.js";
import { recordTeamActivity } from "../team/team-activity.service.js";
import {
  SAVED_CANDIDATE_PRIORITY_LABELS,
  SAVED_CANDIDATE_SORTS,
  SAVED_CANDIDATE_TAG_LABELS,
} from "./saved-candidate.constants.js";
import {
  SAVED_CANDIDATE_EXPORT_BORDER_COLOR,
  SAVED_CANDIDATE_EXPORT_COLUMN_WIDTH,
  SAVED_CANDIDATE_EXPORT_DEFAULT_FIELDS,
  SAVED_CANDIDATE_EXPORT_FIELD_LABELS,
  SAVED_CANDIDATE_EXPORT_FONT,
  SAVED_CANDIDATE_EXPORT_HEADER_FILL,
  SAVED_CANDIDATE_EXPORT_MAX_ROWS,
  SAVED_CANDIDATE_EXPORT_META_LABEL_FILL,
  SAVED_CANDIDATE_EXPORT_META_VALUE_FILL,
  SAVED_CANDIDATE_EXPORT_RESUME_DISPLAY_TEXT,
  SAVED_CANDIDATE_EXPORT_TEXT_FIELDS,
  SAVED_CANDIDATE_EXPORT_TITLE_FILL,
  SAVED_CANDIDATE_EXPORT_WRAP_FIELDS,
  SAVED_CANDIDATE_EXPORT_ZEBRA_FILL,
} from "./saved-candidate-export.constants.js";
import { buildSavedCandidatesPdfReport } from "./saved-candidate-export-pdf.js";
import type {
  SavedCandidateExportField,
  SavedCandidateExportFileResult,
  SavedCandidateExportFilters,
  SavedCandidateExportPreviewResult,
  SavedCandidateExportRow,
} from "./saved-candidate-export.types.js";
import { savedCandidateService } from "./saved-candidate.service.js";
import type {
  SavedCandidateListItem,
  SavedCandidateSort,
} from "./saved-candidate.types.js";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "_");
}

function formatExportDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  const datePart = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

function formatSalary(amount: number | null, period: string | null): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  const formatted = amount.toLocaleString("en-IN");
  const periodLabel =
    period === "year" || period === "yearly" || period === "annum"
      ? "year"
      : period === "day" || period === "daily"
        ? "day"
        : period === "week" || period === "weekly"
          ? "week"
          : "month";
  return `₹${formatted} / ${periodLabel}`;
}

function formatTagLabel(tag: string): string {
  return SAVED_CANDIDATE_TAG_LABELS[tag] ?? tag;
}

function formatTags(tags: string[]): string {
  if (!tags.length) {
    return "—";
  }
  return tags.map(formatTagLabel).join("\n");
}

function sortLabel(sort: SavedCandidateSort | undefined): string {
  const value = sort ?? "recently_saved";
  const labels: Record<SavedCandidateSort, string> = {
    recently_saved: "Recently saved",
    oldest_saved: "Oldest saved",
    recently_updated: "Recently updated",
    experience: "Experience",
    expected_salary: "Expected salary",
    name_asc: "Name (A–Z)",
    name_desc: "Name (Z–A)",
    priority: "Priority",
  };
  return labels[value] ?? value;
}

function safeFilePart(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "Candidate"
  );
}

function digitsOnlyPhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function thinBorder(style: ExcelJS.BorderStyle = "thin"): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = {
    style,
    color: { argb: `FF${SAVED_CANDIDATE_EXPORT_BORDER_COLOR}` },
  };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

function resolveSort(sort: SavedCandidateSort | undefined): SavedCandidateSort {
  if (sort && (SAVED_CANDIDATE_SORTS as readonly string[]).includes(sort)) {
    return sort;
  }
  return "recently_saved";
}

function buildFilterPairs(
  input: SavedCandidateExportFilters,
): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  if (input.search?.trim()) {
    pairs.push(["Search", input.search.trim()]);
  }
  if (input.publicJobId?.trim()) {
    pairs.push(["Job ID", input.publicJobId.trim()]);
  }
  if (input.location?.trim()) {
    pairs.push(["Location", input.location.trim()]);
  }
  if (input.experience?.trim()) {
    pairs.push(["Experience", input.experience.trim()]);
  }
  if (input.availability?.trim()) {
    pairs.push(["Availability", input.availability.trim()]);
  }
  if (input.priority) {
    pairs.push(["Priority", SAVED_CANDIDATE_PRIORITY_LABELS[input.priority]]);
  }
  if (input.tag?.trim()) {
    pairs.push(["Tag", formatTagLabel(input.tag.trim())]);
  }
  pairs.push(["Sort", sortLabel(input.sort)]);
  return pairs;
}

function orderedFields(
  fields: SavedCandidateExportField[],
): SavedCandidateExportField[] {
  const source =
    fields.length > 0 ? fields : [...SAVED_CANDIDATE_EXPORT_DEFAULT_FIELDS];
  return [...new Set(source)];
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function toExportRow(
  item: SavedCandidateListItem,
  employerId: string,
  includeResumeLink: boolean,
): SavedCandidateExportRow {
  const resumeSafeFileName = `${safeFilePart(item.candidateName)}_Resume.pdf`;
  const resumeUrl =
    includeResumeLink && item.hasResume
      ? employerResumeAccessService.resolveResumeAccessUrl({
          applicationId: item.applicationId,
          employerId,
        })
      : "";

  return {
    applicationId: item.applicationId,
    hasResumeSnapshot: item.hasResume,
    resumeSafeFileName,
    applicationStatus: item.applicationStatus || "submitted",
    candidateId: item.jobSeekerId,
    candidateName: item.candidateName || "—",
    phone: digitsOnlyPhone(item.candidatePhone) || item.candidatePhone || "—",
    email: item.candidateEmail?.trim() || "—",
    currentRole: item.candidateHeadline?.trim() || "—",
    experience: item.candidateExperienceLabel?.trim() || "—",
    location: item.candidateLocation?.trim() || "—",
    expectedSalary: formatSalary(
      item.expectedSalary,
      item.expectedSalaryPeriod,
    ),
    availability: item.candidateAvailability?.trim() || "—",
    appliedJob: item.publicJobId
      ? `${item.jobTitle}\n${item.publicJobId}`
      : item.jobTitle || "—",
    savedDate: formatExportDateTime(item.savedAt),
    priority: item.priority
      ? SAVED_CANDIDATE_PRIORITY_LABELS[item.priority]
      : "",
    tags: formatTags(item.tags),
    notes: item.notes?.trim() || "—",
    createdBy: item.createdByName?.trim() || "—",
    skills: item.candidateSkills.length
      ? item.candidateSkills.join("\n")
      : "—",
    resumeAvailable: item.hasResume ? "Available" : "Not available",
    resumeFileName: item.hasResume ? resumeSafeFileName : "—",
    resume: resumeUrl,
  };
}

function estimateRowHeight(
  row: SavedCandidateExportRow,
  fields: SavedCandidateExportField[],
): number {
  let maxLines = 1;
  for (const field of fields) {
    if (!SAVED_CANDIDATE_EXPORT_WRAP_FIELDS.has(field)) {
      continue;
    }
    const value = row[field] ?? "";
    const width = SAVED_CANDIDATE_EXPORT_COLUMN_WIDTH[field];
    const lines = value.split("\n").reduce((sum, line) => {
      const wrapped = Math.max(1, Math.ceil(line.length / Math.max(width, 8)));
      return sum + wrapped;
    }, 0);
    maxLines = Math.max(maxLines, lines);
  }
  return Math.min(90, Math.max(22, 14 + maxLines * 12));
}

async function buildExcel(
  input: SavedCandidateExportFilters,
  rows: SavedCandidateExportRow[],
  companyName: string,
  filterPairs: Array<[string, string]>,
): Promise<Buffer> {
  const fields = orderedFields(input.fields);
  const now = new Date();
  const exportedBy = input.actor?.displayName || "Employer";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AsliJobs";
  workbook.lastModifiedBy = exportedBy;
  workbook.created = now;
  workbook.modified = now;
  workbook.company = companyName;
  workbook.title = "AsliJobs Saved Candidates Report";

  const sheet = workbook.addWorksheet("Saved Candidates", {
    properties: { defaultRowHeight: 18 },
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      paperSize: 9,
    },
  });

  const colCount = Math.max(fields.length, 4);

  // —— Report banner ——
  sheet.mergeCells(1, 1, 1, colCount);
  const brand = sheet.getCell(1, 1);
  brand.value = "ASLIJOBS";
  brand.font = {
    name: SAVED_CANDIDATE_EXPORT_FONT,
    bold: true,
    size: 20,
    color: { argb: "FFFFFFFF" },
  };
  brand.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${SAVED_CANDIDATE_EXPORT_TITLE_FILL}` },
  };
  brand.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 32;

  sheet.mergeCells(2, 1, 2, colCount);
  const title = sheet.getCell(2, 1);
  title.value = "Saved Candidates Report";
  title.font = {
    name: SAVED_CANDIDATE_EXPORT_FONT,
    bold: true,
    size: 14,
    color: { argb: "FFFFFFFF" },
  };
  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${SAVED_CANDIDATE_EXPORT_HEADER_FILL}` },
  };
  title.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(2).height = 24;

  // spacer
  sheet.getRow(3).height = 10;

  // —— Meta block ——
  const meta: Array<[string, string]> = [
    ["Company", companyName],
    ["Exported By", exportedBy],
    ["Export Date", formatExportDateTime(now)],
    ["Export Time", now.toLocaleTimeString("en-IN", { hour12: true })],
    ["Generated By", "AsliJobs ATS"],
    ["Total Records", String(rows.length)],
  ];

  let cursor = 4;
  for (const [label, value] of meta) {
    const labelCell = sheet.getCell(cursor, 1);
    const valueCell = sheet.getCell(cursor, 2);
    sheet.mergeCells(cursor, 2, cursor, Math.min(4, colCount));

    labelCell.value = label;
    valueCell.value = value;
    labelCell.font = {
      name: SAVED_CANDIDATE_EXPORT_FONT,
      bold: true,
      size: 11,
      color: { argb: "FF14532D" },
    };
    valueCell.font = {
      name: SAVED_CANDIDATE_EXPORT_FONT,
      size: 11,
      color: { argb: "FF1E293B" },
    };
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${SAVED_CANDIDATE_EXPORT_META_LABEL_FILL}` },
    };
    valueCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${SAVED_CANDIDATE_EXPORT_META_VALUE_FILL}` },
    };
    labelCell.border = thinBorder();
    valueCell.border = thinBorder();
    labelCell.alignment = { vertical: "middle", horizontal: "left" };
    valueCell.alignment = { vertical: "middle", horizontal: "left" };
    sheet.getRow(cursor).height = 18;
    cursor += 1;
  }

  cursor += 1; // spacer
  sheet.getRow(cursor).height = 8;
  cursor += 1;

  // —— Applied filters section ——
  sheet.mergeCells(cursor, 1, cursor, colCount);
  const filterTitle = sheet.getCell(cursor, 1);
  filterTitle.value = "Applied Filters";
  filterTitle.font = {
    name: SAVED_CANDIDATE_EXPORT_FONT,
    bold: true,
    size: 12,
    color: { argb: "FF14532D" },
  };
  filterTitle.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(cursor).height = 20;
  cursor += 1;

  if (filterPairs.length === 0) {
    sheet.getCell(cursor, 1).value = "None";
    sheet.getCell(cursor, 2).value = "All saved candidates";
    sheet.getCell(cursor, 1).font = {
      name: SAVED_CANDIDATE_EXPORT_FONT,
      size: 11,
    };
    sheet.getCell(cursor, 2).font = {
      name: SAVED_CANDIDATE_EXPORT_FONT,
      size: 11,
    };
    cursor += 1;
  } else {
    for (const [label, value] of filterPairs) {
      sheet.getCell(cursor, 1).value = label;
      sheet.mergeCells(cursor, 2, cursor, Math.min(4, colCount));
      sheet.getCell(cursor, 2).value = value;
      sheet.getCell(cursor, 1).font = {
        name: SAVED_CANDIDATE_EXPORT_FONT,
        bold: true,
        size: 11,
        color: { argb: "FF334155" },
      };
      sheet.getCell(cursor, 2).font = {
        name: SAVED_CANDIDATE_EXPORT_FONT,
        size: 11,
        color: { argb: "FF1E293B" },
      };
      sheet.getCell(cursor, 1).border = thinBorder();
      sheet.getCell(cursor, 2).border = thinBorder();
      sheet.getRow(cursor).height = 18;
      cursor += 1;
    }
  }

  cursor += 1; // spacer before table
  sheet.getRow(cursor).height = 12;
  cursor += 1;

  const headerRowIndex = cursor;

  // Column widths
  fields.forEach((field, index) => {
    sheet.getColumn(index + 1).width = SAVED_CANDIDATE_EXPORT_COLUMN_WIDTH[field];
  });

  // —— Table header ——
  fields.forEach((field, columnIndex) => {
    const cell = sheet.getRow(headerRowIndex).getCell(columnIndex + 1);
    cell.value = SAVED_CANDIDATE_EXPORT_FIELD_LABELS[field];
    cell.font = {
      name: SAVED_CANDIDATE_EXPORT_FONT,
      bold: true,
      size: 12,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${SAVED_CANDIDATE_EXPORT_HEADER_FILL}` },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = thinBorder("medium");
  });
  sheet.getRow(headerRowIndex).height = 26;

  // —— Data rows ——
  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowIndex);
    excelRow.height = estimateRowHeight(row, fields);
    const zebra = rowIndex % 2 === 1;

    fields.forEach((field, columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1);
      cell.border = thinBorder();
      cell.font = {
        name: SAVED_CANDIDATE_EXPORT_FONT,
        size: 11,
        color: { argb: "FF1E293B" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal:
          field === "priority" ||
          field === "resumeAvailable" ||
          field === "experience"
            ? "center"
            : "left",
        wrapText: SAVED_CANDIDATE_EXPORT_WRAP_FIELDS.has(field),
      };

      if (zebra) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: `FF${SAVED_CANDIDATE_EXPORT_ZEBRA_FILL}` },
        };
      }

      if (field === "resume") {
        const url = row.resume?.trim() ?? "";
        if (url && isAbsoluteHttpUrl(url) && row.hasResumeSnapshot) {
          cell.value = {
            text: SAVED_CANDIDATE_EXPORT_RESUME_DISPLAY_TEXT,
            hyperlink: url,
            tooltip: "Open candidate resume",
          };
          cell.font = {
            name: SAVED_CANDIDATE_EXPORT_FONT,
            size: 11,
            color: { argb: "FF0563C1" },
            underline: true,
          };
        } else if (row.hasResumeSnapshot) {
          cell.value = row.resumeFileName || "Available (see ZIP export)";
        } else {
          cell.value = "—";
        }
        return;
      }

      const raw = row[field] ?? "";
      cell.value = raw === "" ? "—" : raw;

      if (SAVED_CANDIDATE_EXPORT_TEXT_FIELDS.has(field)) {
        cell.numFmt = "@";
      }
    });
  });

  const lastDataRow = headerRowIndex + rows.length;

  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: lastDataRow, column: fields.length },
  };

  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRowIndex,
      activeCell: `A${headerRowIndex + 1}`,
      showGridLines: false,
    },
  ];

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function buildPdf(
  input: SavedCandidateExportFilters,
  rows: SavedCandidateExportRow[],
  companyName: string,
  filterPairs: Array<[string, string]>,
): Promise<Buffer> {
  const now = new Date();
  const exportDate = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const exportTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return buildSavedCandidatesPdfReport({
    rows,
    meta: {
      companyName,
      employerName: companyName,
      exportedBy: input.actor?.displayName || "Employer",
      exportDate,
      exportTime,
      filterPairs,
      fields: orderedFields(input.fields),
    },
  });
}

async function collectResumeEntries(
  input: SavedCandidateExportFilters,
  rows: SavedCandidateExportRow[],
): Promise<{
  entries: Array<{ name: string; data: Buffer }>;
  resumesExported: number;
  skipped: number;
}> {
  const entries: Array<{ name: string; data: Buffer }> = [];
  const usedNames = new Set<string>();
  let resumesExported = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.hasResumeSnapshot) {
      skipped += 1;
      continue;
    }
    try {
      const pdf = await applicationService.downloadSnapshotPdfForEmployer({
        employerId: input.employerId,
        applicationId: row.applicationId,
      });
      let name =
        row.resumeSafeFileName ||
        `${safeFilePart(row.candidateName)}_Resume.pdf`;
      if (usedNames.has(name)) {
        name = `${safeFilePart(row.candidateName)}_${row.applicationId.slice(-6)}_Resume.pdf`;
      }
      usedNames.add(name);
      entries.push({ name: `Resumes/${name}`, data: pdf.buffer });
      resumesExported += 1;
    } catch {
      skipped += 1;
    }
  }

  return { entries, resumesExported, skipped };
}

async function buildZipPackage(
  input: SavedCandidateExportFilters,
  rows: SavedCandidateExportRow[],
  companyName: string,
  filterPairs: Array<[string, string]>,
): Promise<SavedCandidateExportFileResult> {
  const pdfBuffer = await buildPdf(input, rows, companyName, filterPairs);
  const { entries: resumeEntries, resumesExported, skipped } =
    await collectResumeEntries(input, rows);

  const summary = [
    "AsliJobs — Saved Candidates Export Package",
    `Company: ${companyName}`,
    `Exported by: ${input.actor?.displayName || "Employer"}`,
    `Export date: ${formatExportDateTime(new Date())}`,
    `Candidates: ${rows.length}`,
    `Resumes exported: ${resumesExported}`,
    `Resumes skipped: ${skipped}`,
    "",
    "Contents:",
    "- Saved_Candidates_Report.pdf",
    "- Resumes/ (PDF files when available)",
    "",
    "Applied filters:",
    ...(filterPairs.length
      ? filterPairs.map(([label, value]) => `- ${label}: ${value}`)
      : ["- None"]),
  ].join("\n");

  const zipEntries = [
    {
      name: "Saved_Candidates_Report.pdf",
      data: pdfBuffer,
    },
    {
      name: "Export_Summary.txt",
      data: Buffer.from(summary, "utf8"),
    },
    ...resumeEntries,
  ];

  return {
    buffer: buildZipStoreBuffer(zipEntries),
    mimeType: "application/zip",
    fileName: `SavedCandidatesExport_${todayStamp()}.zip`,
    totalCandidates: rows.length,
    resumesExported,
  };
}

export class SavedCandidateExportService {
  async preview(
    input: SavedCandidateExportFilters,
  ): Promise<SavedCandidateExportPreviewResult> {
    const sort = resolveSort(input.sort);
    const result = await savedCandidateService.list(input.employerId, {
      search: input.search ?? "",
      publicJobId: input.publicJobId ?? "",
      jobTitle: input.jobTitle ?? "",
      location: input.location ?? "",
      experience: input.experience ?? "",
      availability: input.availability ?? "",
      applicationStatus: input.applicationStatus ?? "",
      priority: input.priority,
      tag: input.tag ?? "",
      sort,
      page: 1,
      limit: 1,
    });

    return {
      total: result.pagination.total,
      maxRows: SAVED_CANDIDATE_EXPORT_MAX_ROWS,
    };
  }

  async export(
    input: SavedCandidateExportFilters,
  ): Promise<SavedCandidateExportFileResult> {
    const preview = await this.preview(input);
    if (preview.total === 0) {
      throw new AppError(
        "No candidates match the selected filters.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    if (preview.total > SAVED_CANDIDATE_EXPORT_MAX_ROWS) {
      throw new AppError(
        `Export is limited to ${SAVED_CANDIDATE_EXPORT_MAX_ROWS} candidates. Narrow your filters and try again.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const sort = resolveSort(input.sort);
    const { items } = await savedCandidateService.listForExport(
      input.employerId,
      {
        search: input.search ?? "",
        publicJobId: input.publicJobId ?? "",
        jobTitle: input.jobTitle ?? "",
        location: input.location ?? "",
        experience: input.experience ?? "",
        availability: input.availability ?? "",
        applicationStatus: input.applicationStatus ?? "",
        priority: input.priority,
        tag: input.tag ?? "",
        sort,
      },
    );

    const employer = await EmployerModel.findById(input.employerId)
      .select("companyName")
      .lean();
    const companyName = text(employer?.companyName) || "AsliJobs Employer";

    const fields = orderedFields(input.fields);

    const exportInput: SavedCandidateExportFilters = {
      ...input,
      fields,
    };

    const includeResumeLink =
      fields.includes("resume") ||
      fields.includes("resumeFileName") ||
      input.format === "zip" ||
      input.format === "pdf";
    const rows = items.map((item) =>
      toExportRow(item, input.employerId, includeResumeLink),
    );
    const filterPairs = buildFilterPairs(exportInput);

    let file: SavedCandidateExportFileResult;

    if (exportInput.format === "zip") {
      file = await buildZipPackage(
        exportInput,
        rows,
        companyName,
        filterPairs,
      );
    } else if (exportInput.format === "pdf") {
      const buffer = await buildPdf(
        exportInput,
        rows,
        companyName,
        filterPairs,
      );
      file = {
        buffer,
        mimeType: "application/pdf",
        fileName: `Saved_Candidates_Report_${todayStamp()}.pdf`,
        totalCandidates: rows.length,
        resumesExported: 0,
      };
    } else {
      const buffer = await buildExcel(
        exportInput,
        rows,
        companyName,
        filterPairs,
      );
      file = {
        buffer,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: `Saved_Candidates_${todayStamp()}.xlsx`,
        totalCandidates: rows.length,
        resumesExported: 0,
      };
    }

    try {
      await recordTeamActivity({
        employerId: input.employerId,
        type: "saved_candidates_exported",
        message: `Exported ${file.totalCandidates} saved candidate(s) as ${input.format.toUpperCase()}.`,
        memberId: input.actor?.teamMemberId ?? null,
        metadata: {
          exportType: input.format,
          totalCandidates: file.totalCandidates,
          resumesExported: file.resumesExported,
          fields: input.fields,
          filters: Object.fromEntries(filterPairs),
          exportedBy: input.actor?.displayName || null,
          ip: input.actor?.ip || null,
          fileName: file.fileName,
          exportedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Audit failure must not block the download.
    }

    return file;
  }
}

export const savedCandidateExportService = new SavedCandidateExportService();
