import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import {
  buildOperationsEmployersCsv,
  buildOperationsEmployersXlsx,
  formatOperationsExportDate,
} from "./operations-employers-export.js";
import type { OperationsEmployerListItem } from "./operations-employers.types.js";

function sampleEmployer(
  overrides: Partial<OperationsEmployerListItem> = {},
): OperationsEmployerListItem {
  return {
    id: "507f1f77bcf86cd799439011",
    displayId: "EMP-0EF6",
    accountType: "company",
    displayName: "Asli Foods",
    companyName: "Asli Foods Pvt Ltd",
    establishmentName: "",
    organizationType: "Company",
    industry: "Food & Beverage",
    phone: "7689094066",
    email: "datta11@gmail.com",
    location: "Hyderabad, Telangana",
    city: "Hyderabad",
    state: "Telangana",
    registeredAt: "2026-09-07T04:30:00.000Z",
    registeredAtDate: "07 Sept 2026",
    registeredAtTime: "10:00 am",
    verificationSubmittedAt: "2026-09-07T04:30:00.000Z",
    documentsCount: 1,
    verificationStatus: "verified",
    verificationStatusLabel: "Verified",
    verifiedAt: null,
    verifiedAtDate: "—",
    status: "active",
    statusLabel: "Active",
    activeJobsCount: 2,
    totalJobsCount: 5,
    logoUrl: "",
    isWhatsappVerified: true,
    isProfileComplete: true,
    registrationStatus: "completed",
    isNewRegistration: false,
    registrationAwarenessState: null,
    ...overrides,
  };
}

const allColumns = {
  includeCompany: true,
  includeLocation: true,
  includePhone: true,
  includeEmail: true,
} as const;

describe("operations employers export", () => {
  it("formats registration dates as DD-MMM-YYYY", () => {
    assert.equal(
      formatOperationsExportDate("2026-09-07T04:30:00.000Z"),
      "07-Sep-2026",
    );
    assert.equal(formatOperationsExportDate(null), "—");
  });

  it("writes UTF-8 BOM CSV and keeps phone / employer id as text literals", () => {
    const file = buildOperationsEmployersCsv({
      rows: [sampleEmployer()],
      columnFlags: allColumns,
    });

    const csv = file.buffer.toString("utf8");
    assert.equal(csv.charCodeAt(0), 0xfeff);
    assert.match(csv, /Company/);
    assert.match(csv, /"=""7689094066"""/);
    assert.match(csv, /"=""EMP-0EF6"""/);
    assert.equal(csv.includes("7.68E"), false);
    assert.ok(file.fileName.endsWith(".csv"));
  });

  it("builds xlsx with text-formatted phone and employer id cells", async () => {
    const file = await buildOperationsEmployersXlsx({
      rows: [
        sampleEmployer(),
        sampleEmployer({
          displayId: "EMP-30BE",
          phone: "9391234567",
          companyName: "తెలుగు కంపెనీ",
        }),
      ],
      columnFlags: allColumns,
    });

    assert.ok(file.fileName.endsWith(".xlsx"));
    assert.match(file.mimeType, /spreadsheetml/);

    const workbook = new ExcelJS.Workbook();
    // ExcelJS typings accept ArrayBuffer-like inputs; Buffer is fine at runtime.
    await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.getWorksheet("Employers");
    assert.ok(sheet);

    assert.equal(sheet.getRow(1).getCell(1).value, "Company");
    assert.equal(sheet.views?.[0]?.state, "frozen");

    const phoneCol = 9;
    const idCol = 8;
    const phoneCell = sheet.getRow(2).getCell(phoneCol);
    const idCell = sheet.getRow(2).getCell(idCol);
    assert.equal(String(phoneCell.value), "7689094066");
    assert.equal(phoneCell.numFmt, "@");
    assert.equal(String(idCell.value), "EMP-0EF6");
    assert.equal(idCell.numFmt, "@");

    assert.equal(String(sheet.getRow(3).getCell(1).value), "తెలుగు కంపెనీ");
  });

  it("omits phone and email columns when RBAC flags exclude them", async () => {
    const file = await buildOperationsEmployersXlsx({
      rows: [sampleEmployer()],
      columnFlags: {
        includeCompany: true,
        includeLocation: true,
        includePhone: false,
        includeEmail: false,
      },
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.getWorksheet("Employers");
    assert.ok(sheet);

    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell) => {
      headers.push(String(cell.value));
    });
    assert.equal(headers.includes("Phone"), false);
    assert.equal(headers.includes("Email"), false);
    assert.ok(headers.includes("Employer ID"));
  });
});
