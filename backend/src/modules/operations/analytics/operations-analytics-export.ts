import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type {
  ANALYTICS_EXPORT_FORMATS,
  ANALYTICS_REPORTS,
  OperationsAnalyticsOverview,
} from "./operations-analytics.types.js";

type ReportId = (typeof ANALYTICS_REPORTS)[number];
type FormatId = (typeof ANALYTICS_EXPORT_FORMATS)[number];

type ExportRow = { section: string; metric: string; value: string };

/** Excel and CSV treat a leading = + - or @ as a formula. Keep the characters and force text. */
export function spreadsheetSafe(value: string): string {
  const text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) return `'${text}`;
  return text;
}

function csvCell(value: string): string {
  const safe = spreadsheetSafe(value);
  if (/[",\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export function analyticsExportRows(
  overview: OperationsAnalyticsOverview,
  report: ReportId,
): ExportRow[] {
  const filters = overview.filters;
  const header: ExportRow[] = [
    { section: "Report", metric: "Title", value: report },
    { section: "Report", metric: "Generated at", value: overview.generatedAt ?? "" },
    { section: "Report", metric: "Range", value: overview.range.label },
    { section: "Report", metric: "From", value: overview.range.from },
    { section: "Report", metric: "To", value: overview.range.to },
    { section: "Report", metric: "Timezone", value: "Asia/Kolkata" },
    { section: "Filter", metric: "State", value: filters?.state || "All" },
    { section: "Filter", metric: "City", value: filters?.city || "All" },
    { section: "Filter", metric: "Category", value: filters?.category || "All" },
    { section: "Filter", metric: "Employer", value: filters?.employer || "All" },
    { section: "Filter", metric: "Job type", value: filters?.jobType || "All" },
    {
      section: "Filter",
      metric: "Application status",
      value: filters?.applicationStatus || "All",
    },
  ];

  const kpis = overview.platformKpis.map((kpi) => ({
    section: "KPI",
    metric: kpi.label,
    value:
      kpi.changeLabel === "percent" && kpi.changePercent != null
        ? `${kpi.value} (previous ${kpi.previousValue}, ${kpi.changePercent}%)`
        : kpi.changeLabel === "new"
          ? `${kpi.value} (New)`
          : String(kpi.value),
  }));
  const funnel = overview.funnel.map((stage) => ({
    section: "Funnel",
    metric: stage.label,
    value: `${stage.count} (${stage.conversionPercent}%)`,
  }));
  const supply = overview.supplyDemand.map((row) => ({
    section: "SupplyDemand",
    metric: row.category,
    value: `supply=${row.supply}; demand=${row.demand}; applications=${row.applications ?? 0}; ratio=${row.ratio ?? ""}; status=${row.status}`,
  }));
  const traffic = [
    ["Page views", overview.websiteTraffic.pageViews],
    ["Unique visitors", overview.websiteTraffic.uniqueVisitors],
    ["Sessions", overview.websiteTraffic.sessions],
  ].map(([metric, value]) => ({
    section: "Website",
    metric: String(metric),
    value: String(value),
  }));
  const interviews = overview.interviewMetrics
    ? [
        ["Scheduled", overview.interviewMetrics.scheduled],
        ["Completed", overview.interviewMetrics.completed],
        ["Rescheduled", overview.interviewMetrics.rescheduled],
        ["Cancelled", overview.interviewMetrics.cancelled],
        ["Missing interview history", overview.interviewMetrics.missingHistory],
        ["Completion rate", overview.interviewMetrics.completionRate ?? ""],
        ["Interview to offer", overview.interviewMetrics.interviewToOfferRate ?? ""],
        ...overview.interviewMetrics.byEmployer.map((row) => [
          `Employer ${row.employerId}`,
          `scheduled=${row.scheduled}; completed=${row.completed}; offers=${row.offers}`,
        ]),
      ].map(([metric, value]) => ({
        section: "Interviews",
        metric: String(metric),
        value: String(value),
      }))
    : [];
  const employers = overview.employerHiring
    ? [
        ...Object.entries(overview.employerHiring)
          .filter(([, value]) => value == null || typeof value !== "object")
          .map(([metric, value]) => ({
            section: "Employers",
            metric,
            value: value == null ? "" : String(value),
          })),
        ...(overview.employerHiring.rows ?? []).map((row) => ({
          section: "EmployerRows",
          metric: row.employerName,
          value: `jobs=${row.jobs}; applications=${row.applications}; interviews=${row.interviews}; offers=${row.offers}; selected=${row.selected}; joined=${row.joined}`,
        })),
      ]
    : [];
  const forecast = (overview.forecastModel?.series ?? []).map((series) => ({
    section: "Forecast",
    metric: series.label,
    value: series.sufficient
      ? `horizon=${overview.forecastModel?.horizonDays}; mae=${series.backtest?.mae ?? ""}; mape=${series.backtest?.mape ?? ""}`
      : series.message,
  }));

  const categoryRows = (overview.categoryBreakdown?.rows ?? []).map((row) => ({
    section: "Category",
    metric: row.category,
    value: `jobs=${row.jobs}; applications=${row.applications}; interviews=${row.interviews}; offers=${row.offers}; selected=${row.selected}; joined=${row.joined}; employers=${row.employers}`,
  }));
  const acquisitionRows = (overview.acquisition?.rows ?? []).map((row) => ({
    section: "Acquisition",
    metric: `${row.source} / ${row.medium} / ${row.campaign}`,
    value: `visitors=${row.visitors}; sessions=${row.sessions}; registrations=${row.registrations}; applications=${row.applications}`,
  }));
  const registrationRows = (overview.registrationFunnel?.jobSeekers ?? []).map((stage) => ({
    section: "Registration",
    metric: stage.label,
    value: stage.count == null ? "unavailable" : String(stage.count),
  }));
  const conversion = overview.jobConversion;
  const conversionRows = conversion
    ? [
        { section: "JobConversion", metric: "Visitor-job pairs", value: String(conversion.visitorJobPairs) },
        { section: "JobConversion", metric: "Applications", value: String(conversion.applications) },
        {
          section: "JobConversion",
          metric: "Detail views",
          value: conversion.detailViewEvents == null ? "unavailable" : String(conversion.detailViewEvents),
        },
      ]
    : [];

  const all = [
    ...header,
    ...kpis,
    ...traffic,
    ...funnel,
    ...supply,
    ...interviews,
    ...employers,
    ...categoryRows,
    ...acquisitionRows,
    ...registrationRows,
    ...conversionRows,
    ...forecast,
    ...(overview.limitations ?? []).map((note) => ({
      section: "Limitation",
      metric: "Note",
      value: note,
    })),
  ];

  if (report === "summary") return all;
  const section: Record<ReportId, string[]> = {
    summary: [],
    "website-traffic": ["Report", "Filter", "Website", "KPI", "Limitation"],
    "job-demand": ["Report", "Filter", "SupplyDemand", "KPI", "Limitation"],
    applications: ["Report", "Filter", "Funnel", "KPI", "Limitation"],
    "hiring-funnel": ["Report", "Filter", "Funnel", "Limitation"],
    interviews: ["Report", "Filter", "Interviews", "Limitation"],
    employers: ["Report", "Filter", "Employers", "EmployerRows", "Limitation"],
    placements: ["Report", "Filter", "KPI", "Funnel", "Limitation"],
    "supply-demand": ["Report", "Filter", "SupplyDemand", "Limitation"],
    forecast: ["Report", "Filter", "Forecast", "Limitation"],
    "category-coverage": ["Report", "Filter", "Category", "Limitation"],
    acquisition: ["Report", "Filter", "Acquisition", "Limitation"],
    "registration-funnel": ["Report", "Filter", "Registration", "Limitation"],
    "job-conversion": ["Report", "Filter", "JobConversion", "Limitation"],
  };
  const allowed = new Set(section[report]);
  return all.filter((row) => allowed.has(row.section));
}

function toCsv(rows: ExportRow[]): string {
  return [
    "Section,Metric,Value",
    ...rows.map(
      (row) =>
        `${csvCell(row.section)},${csvCell(row.metric)},${csvCell(row.value)}`,
    ),
  ].join("\n");
}

async function toXlsx(rows: ExportRow[], title: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AsliJobs";
  const sheet = workbook.addWorksheet("Analytics");
  sheet.addRow([title]);
  sheet.addRow(["Section", "Metric", "Value"]);
  for (const row of rows) {
    sheet.addRow([
      spreadsheetSafe(row.section),
      spreadsheetSafe(row.metric),
      spreadsheetSafe(row.value),
    ]);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function toPdf(rows: ExportRow[], title: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.fontSize(14).text(title);
  doc.moveDown(0.4);
  doc.fontSize(9);
  for (const row of rows) {
    doc.text(`${row.section} — ${row.metric}: ${row.value}`, { width: 520 });
    if (doc.y > 760) doc.addPage();
  }
  doc.end();
  return done;
}

export async function buildAnalyticsExport(
  overview: OperationsAnalyticsOverview,
  report: ReportId,
  format: FormatId,
): Promise<{ filename: string; contentType: string; body: string | Buffer }> {
  const rows = analyticsExportRows(overview, report);
  const stamp = (overview.generatedAt ?? new Date().toISOString()).slice(0, 10);
  const filename = `aslijobs-analytics-${report}-${stamp}.${format === "xlsx" ? "xlsx" : format}`;
  if (format === "xlsx") {
    return {
      filename,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: await toXlsx(rows, `AsliJobs ${report} report`),
    };
  }
  if (format === "pdf") {
    return {
      filename,
      contentType: "application/pdf",
      body: await toPdf(rows, `AsliJobs ${report} report`),
    };
  }
  return {
    filename,
    contentType: "text/csv; charset=utf-8",
    body: toCsv(rows),
  };
}
