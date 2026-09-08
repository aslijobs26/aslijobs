import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import {
  buildOperationsCandidatesExportFile,
  formatCandidatesExportDate,
} from "./operations-candidates-export.js";
import type { OperationsCandidateListItem } from "./operations-candidates.types.js";

function sampleCandidate(
  overrides: Partial<OperationsCandidateListItem> = {},
): OperationsCandidateListItem {
  return {
    id: "507f1f77bcf86cd799439011",
    applicationId: null,
    jobSeekerId: "507f1f77bcf86cd799439011",
    displayId: "AJ-CAN-99439011",
    candidateName: "రాము",
    candidatePhone: "9876543210",
    candidateEmail: "",
    candidateHeadline: "",
    candidateExperienceLabel: "Fresher",
    candidateLocation: "Hyderabad, Telangana",
    candidateSkills: [],
    candidateGender: "male",
    profilePhotoUrl: "",
    preferredRoles: ["Delivery Boy"],
    applicationCount: 2,
    profileStatus: "complete",
    profileStatusLabel: "Complete",
    registrationStatus: "COMPLETED",
    isWhatsappVerified: true,
    lastActiveAt: "2026-09-07T04:30:00.000Z",
    publicJobId: "",
    jobTitle: "",
    employerId: "",
    employerName: "",
    employerLogoUrl: "",
    employerVerified: false,
    status: null,
    statusLabel: "No application",
    appliedAt: null,
    registeredAt: "2026-09-07T04:30:00.000Z",
    hasApplication: false,
    isNewRegistration: false,
    registrationAwarenessState: null,
    ...overrides,
  };
}

const allColumns = {
  includeName: true,
  includePhone: true,
  includeLocation: true,
} as const;

describe("operations candidates export", () => {
  it("formats dates as DD-MMM-YYYY", () => {
    assert.equal(
      formatCandidatesExportDate("2026-09-07T04:30:00.000Z"),
      "07-Sep-2026",
    );
    assert.equal(formatCandidatesExportDate(null), "—");
  });

  it("writes UTF-8 BOM CSV and keeps phone / candidate id as text literals", async () => {
    const file = await buildOperationsCandidatesExportFile({
      rows: [sampleCandidate()],
      format: "csv",
      columnFlags: allColumns,
    });

    const csv = file.buffer.toString("utf8");
    assert.equal(csv.charCodeAt(0), 0xfeff);
    assert.match(csv, /Candidate ID/);
    assert.match(csv, /"=""9876543210"""/);
    assert.match(csv, /"=""AJ-CAN-99439011"""/);
    assert.equal(csv.includes("9.876E"), false);
    assert.ok(file.fileName.endsWith(".csv"));
  });

  it("omits unauthorized columns", async () => {
    const file = await buildOperationsCandidatesExportFile({
      rows: [sampleCandidate()],
      format: "csv",
      columnFlags: {
        includeName: false,
        includePhone: false,
        includeLocation: true,
      },
    });
    const csv = file.buffer.toString("utf8");
    assert.equal(csv.includes("Candidate Name"), false);
    assert.equal(csv.includes("Phone"), false);
    assert.match(csv, /Location/);
  });

  it("builds xlsx with text-formatted phone and candidate id cells", async () => {
    const file = await buildOperationsCandidatesExportFile({
      rows: [
        sampleCandidate(),
        sampleCandidate({
          displayId: "AJ-CAN-AABBCCDD",
          candidatePhone: "9391234567",
          candidateName: "సీత",
        }),
      ],
      format: "xlsx",
      columnFlags: allColumns,
    });

    assert.ok(file.fileName.endsWith(".xlsx"));
    assert.match(file.mimeType, /spreadsheetml/);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.getWorksheet("Candidates");
    assert.ok(sheet);

    assert.equal(sheet.getRow(1).getCell(1).value, "Candidate ID");
    assert.equal(sheet.views?.[0]?.state, "frozen");

    const idCell = sheet.getRow(2).getCell(1);
    const phoneCell = sheet.getRow(2).getCell(3);
    assert.equal(idCell.value, "AJ-CAN-99439011");
    assert.equal(phoneCell.value, "9876543210");
    assert.equal(idCell.numFmt, "@");
    assert.equal(phoneCell.numFmt, "@");

    const nameCell = sheet.getRow(3).getCell(2);
    assert.equal(nameCell.value, "సీత");
  });
});
