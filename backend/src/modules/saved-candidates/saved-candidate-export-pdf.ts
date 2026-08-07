import PDFDocument from "pdfkit";
import {
  SAVED_CANDIDATE_EXPORT_PDF_COLORS as C,
  SAVED_CANDIDATE_EXPORT_PDF_DETAIL_PAGE_LIMIT,
} from "./saved-candidate-export.constants.js";
import type {
  SavedCandidateExportField,
  SavedCandidateExportRow,
} from "./saved-candidate-export.types.js";

type PdfMeta = {
  companyName: string;
  employerName: string;
  exportedBy: string;
  exportDate: string;
  exportTime: string;
  filterPairs: Array<[string, string]>;
  fields: SavedCandidateExportField[];
};

type PdfStats = {
  totalSaved: number;
  highPriority: number;
  interviewReady: number;
  contacted: number;
  immediateJoiners: number;
  exportedCandidates: number;
};

const TABLE_COLUMNS: Array<{
  key: SavedCandidateExportField;
  label: string;
  weight: number;
}> = [
  { key: "candidateName", label: "Candidate Name", weight: 1.35 },
  { key: "experience", label: "Experience", weight: 0.85 },
  { key: "currentRole", label: "Current Role", weight: 1.2 },
  { key: "location", label: "Location", weight: 1.1 },
  { key: "expectedSalary", label: "Salary", weight: 0.95 },
  { key: "availability", label: "Availability", weight: 0.95 },
  { key: "appliedJob", label: "Applied Job", weight: 1.25 },
  { key: "priority", label: "Priority", weight: 0.7 },
  { key: "tags", label: "Tags", weight: 1.1 },
  { key: "savedDate", label: "Saved Date", weight: 0.95 },
  { key: "notes", label: "Notes", weight: 1.3 },
];

function flatten(value: string): string {
  return (value || "—").replace(/\s*\n\s*/g, " · ").trim() || "—";
}

function truncate(value: string, max: number): string {
  const next = flatten(value);
  if (next.length <= max) {
    return next;
  }
  return `${next.slice(0, max - 1)}…`;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function computeStats(rows: SavedCandidateExportRow[]): PdfStats {
  const interviewReadyStatuses = new Set([
    "shortlisted",
    "interview_scheduled",
    "interview_completed",
  ]);
  const contactedStatuses = new Set([
    "viewed",
    "contacted",
    "shortlisted",
    "interview_scheduled",
    "interview_completed",
    "offer_sent",
    "hired",
  ]);

  let highPriority = 0;
  let interviewReady = 0;
  let contacted = 0;
  let immediateJoiners = 0;

  for (const row of rows) {
    if (row.priority.trim().toLowerCase() === "high") {
      highPriority += 1;
    }
    if (interviewReadyStatuses.has(row.applicationStatus)) {
      interviewReady += 1;
    }
    if (contactedStatuses.has(row.applicationStatus)) {
      contacted += 1;
    }
    if (/immediate/i.test(row.tags)) {
      immediateJoiners += 1;
    }
  }

  return {
    totalSaved: rows.length,
    highPriority,
    interviewReady,
    contacted,
    immediateJoiners,
    exportedCandidates: rows.length,
  };
}

function fieldVisible(
  fields: SavedCandidateExportField[],
  field: SavedCandidateExportField,
): boolean {
  return fields.includes(field);
}

function cellFor(
  row: SavedCandidateExportRow,
  field: SavedCandidateExportField,
  fields: SavedCandidateExportField[],
): string {
  if (!fieldVisible(fields, field) && field !== "candidateName") {
    // Always show name; hide sensitive columns not selected
    if (
      field === "phone" ||
      field === "email" ||
      field === "notes" ||
      field === "expectedSalary" ||
      field === "resume" ||
      field === "resumeFileName" ||
      field === "resumeAvailable"
    ) {
      return "—";
    }
  }
  return flatten(row[field] ?? "—");
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const pageNumber = i - range.start + 1;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc
      .fontSize(8)
      .fillColor(C.muted)
      .font("Helvetica")
      .text(
        `AsliJobs  ·  Confidential  ·  Page ${pageNumber} of ${range.count}`,
        doc.page.margins.left,
        doc.page.height - 28,
        { width: pageWidth, align: "center" },
      );
  }
}

function drawBrandHeader(doc: PDFKit.PDFDocument, pageWidth: number): void {
  const startX = doc.page.margins.left;
  const y = doc.page.margins.top;

  doc.save();
  doc.rect(startX, y, pageWidth, 42).fill(C.header);
  doc.restore();

  doc
    .fillColor(C.white)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("ASLIJOBS", startX + 14, y + 12, { width: pageWidth / 2 });

  doc
    .fillColor(C.white)
    .font("Helvetica")
    .fontSize(9)
    .text("Saved Candidates Report", startX + pageWidth / 2, y + 15, {
      width: pageWidth / 2 - 14,
      align: "right",
    });

  doc.y = y + 54;
}

function drawMetaGrid(
  doc: PDFKit.PDFDocument,
  meta: PdfMeta,
  pageWidth: number,
): void {
  const startX = doc.page.margins.left;
  const items: Array<[string, string]> = [
    ["Company Name", meta.companyName],
    ["Employer Name", meta.employerName],
    ["Exported By", meta.exportedBy],
    ["Export Date", meta.exportDate],
    ["Export Time", meta.exportTime],
    ["Generated From", "Saved Candidates"],
  ];

  const colWidth = (pageWidth - 12) / 2;
  let y = doc.y;

  items.forEach((pair, index) => {
    const col = index % 2;
    if (col === 0 && index > 0) {
      y += 28;
    }
    const x = startX + col * (colWidth + 12);

    doc.save();
    doc.rect(x, y, colWidth, 24).fill(C.cardBg);
    doc.restore();

    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(7)
      .text(pair[0].toUpperCase(), x + 8, y + 4, { width: colWidth - 16 });
    doc
      .fillColor(C.text)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(pair[1], x + 8, y + 12, {
        width: colWidth - 16,
        ellipsis: true,
      });
  });

  doc.y = y + 36;
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  pageWidth: number,
): void {
  const startX = doc.page.margins.left;
  const y = doc.y;
  doc
    .fillColor(C.title)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(title, startX, y);
  doc
    .moveTo(startX, doc.y + 4)
    .lineTo(startX + pageWidth, doc.y + 4)
    .strokeColor(C.border)
    .lineWidth(1)
    .stroke();
  doc.y += 14;
}

function drawFilterSummary(
  doc: PDFKit.PDFDocument,
  filterPairs: Array<[string, string]>,
  pageWidth: number,
): void {
  drawSectionTitle(doc, "Applied Filters", pageWidth);
  const startX = doc.page.margins.left;

  if (!filterPairs.length) {
    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(9)
      .text("No filters applied — exporting all saved candidates.", startX);
    doc.moveDown(0.8);
    return;
  }

  const colWidth = (pageWidth - 16) / 3;
  let y = doc.y;
  filterPairs.forEach((pair, index) => {
    const col = index % 3;
    if (col === 0 && index > 0) {
      y += 34;
    }
    const x = startX + col * (colWidth + 8);

    doc.save();
    doc.roundedRect(x, y, colWidth, 28, 3).fill("#F8FAFC");
    doc.restore();
    doc
      .lineWidth(0.6)
      .strokeColor(C.border)
      .roundedRect(x, y, colWidth, 28, 3)
      .stroke();

    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(7)
      .text(pair[0].toUpperCase(), x + 8, y + 5, { width: colWidth - 16 });
    doc
      .fillColor(C.text)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(pair[1], x + 8, y + 14, {
        width: colWidth - 16,
        ellipsis: true,
      });
  });

  doc.y = y + 42;
}

function drawStatsCards(
  doc: PDFKit.PDFDocument,
  stats: PdfStats,
  pageWidth: number,
): void {
  drawSectionTitle(doc, "Statistics", pageWidth);
  const startX = doc.page.margins.left;
  const cards: Array<[string, number]> = [
    ["Total Saved", stats.totalSaved],
    ["High Priority", stats.highPriority],
    ["Interview Ready", stats.interviewReady],
    ["Contacted", stats.contacted],
    ["Immediate Joiners", stats.immediateJoiners],
    ["Exported Candidates", stats.exportedCandidates],
  ];

  const gap = 8;
  const cardWidth = (pageWidth - gap * 5) / 6;
  const y = doc.y;

  cards.forEach((card, index) => {
    const x = startX + index * (cardWidth + gap);
    doc.save();
    doc.roundedRect(x, y, cardWidth, 46, 4).fill(C.cardBg);
    doc.restore();
    doc
      .lineWidth(0.8)
      .strokeColor(C.header)
      .roundedRect(x, y, cardWidth, 46, 4)
      .stroke();

    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(6.5)
      .text(card[0].toUpperCase(), x + 6, y + 8, {
        width: cardWidth - 12,
        align: "center",
      });
    doc
      .fillColor(C.header)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(String(card[1]), x + 6, y + 22, {
        width: cardWidth - 12,
        align: "center",
      });
  });

  doc.y = y + 58;
}

function columnWidths(pageWidth: number): number[] {
  const total = TABLE_COLUMNS.reduce((sum, col) => sum + col.weight, 0);
  return TABLE_COLUMNS.map((col) => (col.weight / total) * pageWidth);
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  startX: number,
  y: number,
  pageWidth: number,
  widths: number[],
): number {
  const height = 22;
  doc.save();
  doc.rect(startX, y, pageWidth, height).fill(C.header);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(7).fillColor(C.white);
  let x = startX;
  TABLE_COLUMNS.forEach((col, index) => {
    const width = widths[index] ?? 40;
    doc.text(col.label, x + 3, y + 7, {
      width: width - 6,
      height: height - 8,
      ellipsis: true,
    });
    x += width;
  });
  return y + height;
}

function drawCandidateTable(
  doc: PDFKit.PDFDocument,
  rows: SavedCandidateExportRow[],
  fields: SavedCandidateExportField[],
  pageWidth: number,
): void {
  drawSectionTitle(doc, "Candidate Summary", pageWidth);

  const startX = doc.page.margins.left;
  const footerReserve = 36;
  const widths = columnWidths(pageWidth);
  let y = doc.y;

  const ensureSpace = (needed: number) => {
    if (
      y + needed <=
      doc.page.height - doc.page.margins.bottom - footerReserve
    ) {
      return;
    }
    doc.addPage({ size: "A4", layout: "landscape", margin: 36 });
    drawBrandHeader(doc, pageWidth);
    y = doc.y;
    y = drawTableHeader(doc, startX, y, pageWidth, widths);
  };

  y = drawTableHeader(doc, startX, y, pageWidth, widths);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]!;
    const values = TABLE_COLUMNS.map((col) =>
      truncate(cellFor(row, col.key, fields), 80),
    );

    doc.font("Helvetica").fontSize(7);
    const rowHeight = Math.max(
      16,
      ...values.map((value, index) =>
        doc.heightOfString(value, { width: (widths[index] ?? 40) - 6 }),
      ),
    );

    ensureSpace(rowHeight);

    if (rowIndex % 2 === 1) {
      doc.save();
      doc.rect(startX, y, pageWidth, rowHeight).fill(C.zebra);
      doc.restore();
    }

    doc.save();
    doc.lineWidth(0.4).strokeColor(C.border);
    doc.rect(startX, y, pageWidth, rowHeight).stroke();
    let gridX = startX;
    for (let i = 0; i < TABLE_COLUMNS.length - 1; i += 1) {
      gridX += widths[i] ?? 0;
      doc
        .moveTo(gridX, y)
        .lineTo(gridX, y + rowHeight)
        .stroke();
    }
    doc.restore();

    let x = startX;
    values.forEach((value, index) => {
      const width = widths[index] ?? 40;
      doc
        .fillColor(C.text)
        .font("Helvetica")
        .fontSize(7)
        .text(value, x + 3, y + 3, {
          width: width - 6,
          height: rowHeight - 4,
          ellipsis: true,
        });
      x += width;
    });

    y += rowHeight;
  }

  doc.y = y + 12;
}

function drawResumeIndex(
  doc: PDFKit.PDFDocument,
  rows: SavedCandidateExportRow[],
  fields: SavedCandidateExportField[],
  pageWidth: number,
): void {
  const canShowResume =
    fieldVisible(fields, "resume") ||
    fieldVisible(fields, "resumeAvailable") ||
    fieldVisible(fields, "resumeFileName");

  if (!canShowResume) {
    return;
  }

  doc.addPage({ size: "A4", layout: "landscape", margin: 36 });
  drawBrandHeader(doc, pageWidth);
  drawSectionTitle(doc, "Resume Availability", pageWidth);

  const startX = doc.page.margins.left;
  const footerReserve = 36;
  let y = doc.y;

  const cols = [
    { label: "Candidate", width: pageWidth * 0.28 },
    { label: "Resume Available", width: pageWidth * 0.14 },
    { label: "Resume File Name", width: pageWidth * 0.28 },
    { label: "Resume Download URL", width: pageWidth * 0.3 },
  ];

  const drawHeader = () => {
    doc.save();
    doc.rect(startX, y, pageWidth, 20).fill(C.header);
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(8).fillColor(C.white);
    let x = startX;
    cols.forEach((col) => {
      doc.text(col.label, x + 4, y + 6, { width: col.width - 8 });
      x += col.width;
    });
    y += 20;
  };

  drawHeader();

  rows.forEach((row, index) => {
    const available = row.hasResumeSnapshot ? "YES" : "NO";
    const fileName = row.hasResumeSnapshot
      ? row.resumeSafeFileName || row.resumeFileName || "—"
      : "Resume Not Available";
    const url =
      row.hasResumeSnapshot && isHttpUrl(row.resume) ? row.resume : "—";
    const values = [
      truncate(row.candidateName, 60),
      available,
      truncate(fileName, 70),
      truncate(url, 90),
    ];

    doc.font("Helvetica").fontSize(7.5);
    const rowHeight = Math.max(
      16,
      ...values.map((value, i) =>
        doc.heightOfString(value, { width: cols[i]!.width - 8 }),
      ),
    );

    if (y + rowHeight > doc.page.height - doc.page.margins.bottom - footerReserve) {
      doc.addPage({ size: "A4", layout: "landscape", margin: 36 });
      drawBrandHeader(doc, pageWidth);
      y = doc.y;
      drawHeader();
    }

    if (index % 2 === 1) {
      doc.save();
      doc.rect(startX, y, pageWidth, rowHeight).fill(C.zebra);
      doc.restore();
    }

    doc.save();
    doc.lineWidth(0.4).strokeColor(C.border);
    doc.rect(startX, y, pageWidth, rowHeight).stroke();
    doc.restore();

    let x = startX;
    values.forEach((value, i) => {
      const col = cols[i]!;
      if (i === 3 && isHttpUrl(value)) {
        doc
          .fillColor(C.link)
          .font("Helvetica")
          .fontSize(7)
          .text("Open Resume", x + 4, y + 4, {
            width: col.width - 8,
            link: value,
            underline: true,
          });
      } else {
        doc
          .fillColor(i === 1 && value === "YES" ? C.title : C.text)
          .font(i === 1 ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.5)
          .text(value, x + 4, y + 4, { width: col.width - 8 });
      }
      x += col.width;
    });

    y += rowHeight;
  });

  doc.y = y + 8;
}

function initials(name: string): string {
  const parts = name
    .replace(/[—-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) {
    return "C";
  }
  return parts.map((part) => part[0]!.toUpperCase()).join("");
}

function drawDetailField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
): number {
  doc
    .fillColor(C.muted)
    .font("Helvetica")
    .fontSize(7)
    .text(label.toUpperCase(), x, y, { width });
  const valueHeight = doc.heightOfString(value || "—", { width });
  doc
    .fillColor(C.text)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(value || "—", x, y + 10, { width });
  return 16 + valueHeight;
}

function drawDetailPages(
  doc: PDFKit.PDFDocument,
  rows: SavedCandidateExportRow[],
  fields: SavedCandidateExportField[],
): void {
  const limited = rows.slice(0, SAVED_CANDIDATE_EXPORT_PDF_DETAIL_PAGE_LIMIT);

  if (rows.length > SAVED_CANDIDATE_EXPORT_PDF_DETAIL_PAGE_LIMIT) {
    doc.addPage({ size: "A4", layout: "portrait", margin: 48 });
    const portraitWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    drawBrandHeader(doc, portraitWidth);
    drawSectionTitle(doc, "Detailed Profiles", portraitWidth);
    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(10)
      .text(
        `This export includes ${rows.length.toLocaleString()} candidates. Individual profile pages are limited to the first ${SAVED_CANDIDATE_EXPORT_PDF_DETAIL_PAGE_LIMIT} for performance. Use the Excel export for full tabular analysis.`,
        doc.page.margins.left,
        doc.y,
        { width: portraitWidth },
      );
  }

  for (let index = 0; index < limited.length; index += 1) {
    const row = limited[index]!;
    doc.addPage({ size: "A4", layout: "portrait", margin: 48 });
    const width =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;

    drawBrandHeader(doc, width);

    doc
      .fillColor(C.title)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(`Candidate Profile  ·  ${index + 1} of ${limited.length}`, startX);

    doc.moveDown(0.6);

    const avatarSize = 56;
    const avatarY = doc.y;
    doc.save();
    doc.circle(startX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2).fill(C.header);
    doc.restore();
    doc
      .fillColor(C.white)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(initials(row.candidateName), startX, avatarY + 18, {
        width: avatarSize,
        align: "center",
      });

    const textX = startX + avatarSize + 16;
    doc
      .fillColor(C.text)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(row.candidateName, textX, avatarY + 6, {
        width: width - avatarSize - 16,
      });
    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(10)
      .text(flatten(row.currentRole), textX, doc.y + 2, {
        width: width - avatarSize - 16,
      });
    doc
      .fillColor(C.title)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(
        [
          flatten(row.priority)
            ? `${flatten(row.priority)} Priority`
            : null,
          flatten(row.experience) || null,
          flatten(row.location) || null,
        ]
          .filter(Boolean)
          .join("  ·  "),
        textX,
        doc.y + 4,
        { width: width - avatarSize - 16 },
      );

    doc.y = Math.max(doc.y, avatarY + avatarSize) + 18;

    doc
      .moveTo(startX, doc.y)
      .lineTo(startX + width, doc.y)
      .strokeColor(C.border)
      .lineWidth(1)
      .stroke();
    doc.y += 14;

    const leftFields: Array<[string, string]> = [];
    const rightFields: Array<[string, string]> = [];

    if (fieldVisible(fields, "phone")) {
      leftFields.push(["Phone", flatten(row.phone)]);
    }
    if (fieldVisible(fields, "email")) {
      leftFields.push(["Email", flatten(row.email)]);
    }
    if (fieldVisible(fields, "expectedSalary")) {
      leftFields.push(["Expected Salary", flatten(row.expectedSalary)]);
    }
    if (fieldVisible(fields, "availability")) {
      leftFields.push(["Availability", flatten(row.availability)]);
    }

    rightFields.push(["Applied Job", flatten(row.appliedJob)]);
    rightFields.push(["Saved Date", flatten(row.savedDate)]);
    if (fieldVisible(fields, "tags")) {
      rightFields.push(["Tags", flatten(row.tags)]);
    }
    if (
      fieldVisible(fields, "resumeAvailable") ||
      fieldVisible(fields, "resume")
    ) {
      rightFields.push([
        "Resume Status",
        row.hasResumeSnapshot ? "Available" : "Resume Not Available",
      ]);
    }

    const colWidth = (width - 20) / 2;
    let leftY = doc.y;
    let rightY = doc.y;

    leftFields.forEach((pair) => {
      leftY += drawDetailField(doc, pair[0], pair[1], startX, leftY, colWidth) + 8;
    });
    rightFields.forEach((pair) => {
      rightY +=
        drawDetailField(doc, pair[0], pair[1], startX + colWidth + 20, rightY, colWidth) +
        8;
    });

    doc.y = Math.max(leftY, rightY) + 8;

    if (fieldVisible(fields, "skills") && row.skills && row.skills !== "—") {
      drawSectionTitle(doc, "Skills", width);
      doc
        .fillColor(C.text)
        .font("Helvetica")
        .fontSize(9)
        .text(flatten(row.skills), startX, doc.y, { width });
      doc.moveDown(0.8);
    }

    drawSectionTitle(doc, "About Candidate", width);
    const about = [
      flatten(row.currentRole) !== "—" ? flatten(row.currentRole) : "",
      flatten(row.experience) !== "—"
        ? `Experience: ${flatten(row.experience)}`
        : "",
      flatten(row.location) !== "—" ? `Based in ${flatten(row.location)}` : "",
      flatten(row.availability) !== "—"
        ? `Availability: ${flatten(row.availability)}`
        : "",
    ]
      .filter(Boolean)
      .join(". ");
    doc
      .fillColor(C.text)
      .font("Helvetica")
      .fontSize(9)
      .text(about || "No additional profile summary available.", startX, doc.y, {
        width,
      });
    doc.moveDown(0.9);

    if (fieldVisible(fields, "notes")) {
      drawSectionTitle(doc, "Employer Notes", width);
      doc
        .fillColor(C.text)
        .font("Helvetica")
        .fontSize(9)
        .text(flatten(row.notes), startX, doc.y, { width });
      doc.moveDown(0.8);
    }

    if (
      row.hasResumeSnapshot &&
      (fieldVisible(fields, "resumeFileName") || fieldVisible(fields, "resume"))
    ) {
      drawSectionTitle(doc, "Resume", width);
      doc
        .fillColor(C.text)
        .font("Helvetica")
        .fontSize(9)
        .text(`File: ${row.resumeSafeFileName || row.resumeFileName}`, startX);
      if (isHttpUrl(row.resume)) {
        doc
          .fillColor(C.link)
          .font("Helvetica")
          .fontSize(9)
          .text("Open Resume Download URL", startX, doc.y + 4, {
            link: row.resume,
            underline: true,
          });
      }
    } else if (
      fieldVisible(fields, "resumeAvailable") ||
      fieldVisible(fields, "resume")
    ) {
      drawSectionTitle(doc, "Resume", width);
      doc
        .fillColor(C.muted)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("Resume Not Available", startX);
    }
  }
}

export async function buildSavedCandidatesPdfReport(options: {
  rows: SavedCandidateExportRow[];
  meta: PdfMeta;
}): Promise<Buffer> {
  const { rows, meta } = options;
  const stats = computeStats(rows);

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 36,
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: "AsliJobs Saved Candidates Report",
      Author: meta.companyName,
      Subject: "Saved Candidates Export",
      Creator: "AsliJobs",
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

  // —— Cover / summary page ——
  drawBrandHeader(doc, pageWidth);

  doc
    .fillColor(C.text)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Saved Candidates Report", doc.page.margins.left, doc.y);
  doc.moveDown(0.35);
  doc
    .fillColor(C.muted)
    .font("Helvetica")
    .fontSize(10)
    .text(
      "Enterprise talent pipeline report for hiring and stakeholder review.",
      doc.page.margins.left,
      doc.y,
      { width: pageWidth },
    );
  doc.moveDown(0.8);

  drawMetaGrid(doc, meta, pageWidth);
  drawFilterSummary(doc, meta.filterPairs, pageWidth);
  drawStatsCards(doc, stats, pageWidth);

  // —— Table (may span pages; header repeats) ——
  drawCandidateTable(doc, rows, meta.fields, pageWidth);

  // —— Resume index ——
  drawResumeIndex(doc, rows, meta.fields, pageWidth);

  // —— Detail pages ——
  drawDetailPages(doc, rows, meta.fields);

  drawFooter(doc);
  doc.end();
  return done;
}
