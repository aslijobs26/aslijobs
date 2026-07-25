import PDFDocument from "pdfkit";
import type { ResumeJson } from "../resume.types.js";

export type GenerateResumePdfFromJsonResult = {
  buffer: Buffer;
  mimeType: "application/pdf";
  fileName: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatSalary(
  amount: number | null | undefined,
  period: string | null | undefined,
): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "";
  }

  const periodLabel =
    period === "per-year"
      ? "per year"
      : period === "per-month"
        ? "per month"
        : "";

  return periodLabel ? `${amount} ${periodLabel}` : String(amount);
}

function educationInstitute(entry: ResumeJson["sections"]["education"][number]): string {
  return (
    text(entry.collegeName) ||
    text(entry.instituteName) ||
    text(entry.schoolName) ||
    ""
  );
}

function educationDetails(entry: ResumeJson["sections"]["education"][number]): string {
  const parts = [
    text(entry.degree),
    text(entry.specialization),
    text(entry.stream),
    text(entry.trade),
    text(entry.branch),
    text(entry.board),
  ].filter(Boolean);

  return parts.join(" · ");
}

/**
 * Builds an ATS-friendly A4 PDF from stored ResumeJson only.
 * Does not remap from the live Job Seeker profile.
 */
export async function generateResumePdfFromJson(
  resumeJson: ResumeJson,
  options?: { fileName?: string },
): Promise<GenerateResumePdfFromJsonResult> {
  const fileName =
    options?.fileName?.trim() ||
    `${text(resumeJson.header.fullName) || "resume"}-aslijobs.pdf`.replace(
      /\s+/g,
      "-",
    );

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: {
        Title: `${text(resumeJson.header.fullName) || "Resume"} - AsliJobs`,
        Author: text(resumeJson.header.fullName) || "AsliJobs",
        Creator: "AsliJobs ATS Resume",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    const writeSectionTitle = (title: string) => {
      doc.moveDown(0.8);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#111111")
        .text(title.toUpperCase(), { continued: false });
      doc
        .moveTo(doc.page.margins.left, doc.y + 2)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
        .strokeColor("#333333")
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10).fillColor("#111111");
    };

    const writeParagraph = (body: string) => {
      if (!text(body)) {
        return;
      }
      doc.font("Helvetica").fontSize(10).fillColor("#111111").text(body, {
        align: "left",
        lineGap: 2,
      });
    };

    // Header
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#111111")
      .text(text(resumeJson.header.fullName) || "Job Seeker");

    const headline =
      text(resumeJson.sections.professionalHeadline) ||
      text(resumeJson.header.headline);
    if (headline) {
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(11).text(headline);
    }

    const contactBits = [
      text(resumeJson.header.phone) || text(resumeJson.sections.contact.phone),
      [text(resumeJson.header.city), text(resumeJson.header.state)]
        .filter(Boolean)
        .join(", ") || text(resumeJson.header.location),
    ].filter(Boolean);

    if (contactBits.length > 0) {
      doc.moveDown(0.25);
      doc.fontSize(9).fillColor("#333333").text(contactBits.join("  |  "));
    }

    // Summary
    if (text(resumeJson.sections.professionalSummary)) {
      writeSectionTitle("Professional Summary");
      writeParagraph(resumeJson.sections.professionalSummary);
    }

    // Objective
    if (text(resumeJson.sections.careerObjective)) {
      writeSectionTitle("Career Objective");
      writeParagraph(resumeJson.sections.careerObjective);
    }

    // Skills
    if (resumeJson.sections.skills.length > 0) {
      writeSectionTitle("Skills");
      writeParagraph(resumeJson.sections.skills.join(", "));
    }

    // Education
    if (resumeJson.sections.education.length > 0) {
      writeSectionTitle("Education");
      for (const entry of resumeJson.sections.education) {
        const level = text(entry.level).replaceAll("_", " ");
        const institute = educationInstitute(entry);
        const year = text(entry.passingYear);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#111111")
          .text([level, institute].filter(Boolean).join(" — "));
        const details = educationDetails(entry);
        if (details || year) {
          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#333333")
            .text([details, year].filter(Boolean).join(" · "));
        }
        doc.moveDown(0.35);
      }
    }

    // Experience
    writeSectionTitle("Experience");
    if (resumeJson.sections.isFresher || resumeJson.sections.experience.length === 0) {
      writeParagraph(text(resumeJson.sections.experienceLabel) || "Fresher");
    } else {
      for (const entry of resumeJson.sections.experience) {
        const titleLine = [
          text(entry.jobRole),
          text(entry.companyName),
        ]
          .filter(Boolean)
          .join(" — ");
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111").text(titleLine);

        const meta = [
          text(entry.industry),
          [text(entry.startDate), entry.currentlyWorking ? "Present" : text(entry.endDate)]
            .filter(Boolean)
            .join(" – "),
          text(entry.duration),
          text(entry.location),
        ].filter(Boolean);

        if (meta.length > 0) {
          doc.font("Helvetica").fontSize(9).fillColor("#333333").text(meta.join(" · "));
        }

        if (text(entry.responsibilities)) {
          doc.moveDown(0.15);
          writeParagraph(entry.responsibilities);
        }
        doc.moveDown(0.35);
      }
    }

    // Languages
    if (resumeJson.sections.languages.length > 0) {
      writeSectionTitle("Languages");
      writeParagraph(
        resumeJson.sections.languages
          .map((language) => language.charAt(0).toUpperCase() + language.slice(1))
          .join(", "),
      );
    }

    // Career Preferences
    const prefs = resumeJson.sections.careerPreferences;
    const prefLines = [
      text(prefs.preferredJobRole)
        ? `Preferred role: ${text(prefs.preferredJobRole)}`
        : "",
      text(prefs.preferredJobLocation)
        ? `Preferred location: ${text(prefs.preferredJobLocation)}`
        : "",
      prefs.jobType ? `Job type: ${prefs.jobType}` : "",
      prefs.workMode ? `Work mode: ${prefs.workMode}` : "",
      formatSalary(prefs.expectedSalary, prefs.expectedSalaryPeriod)
        ? `Expected salary: ${formatSalary(prefs.expectedSalary, prefs.expectedSalaryPeriod)}`
        : "",
      text(resumeJson.sections.availability)
        ? `Availability: ${text(resumeJson.sections.availability)}`
        : "",
    ].filter(Boolean);

    if (prefLines.length > 0) {
      writeSectionTitle("Career Preferences");
      for (const line of prefLines) {
        writeParagraph(line);
      }
    }

    // Contact
    writeSectionTitle("Contact");
    const contact = resumeJson.sections.contact;
    const contactLines = [
      text(contact.fullName) ? `Name: ${text(contact.fullName)}` : "",
      text(contact.phone) ? `Mobile: ${text(contact.phone)}` : "",
      text(contact.city) ? `City: ${text(contact.city)}` : "",
      text(contact.state) ? `State: ${text(contact.state)}` : "",
    ].filter(Boolean);

    if (contactLines.length === 0) {
      writeParagraph("Contact details not available.");
    } else {
      for (const line of contactLines) {
        writeParagraph(line);
      }
    }

    doc.end();
  });

  return {
    buffer,
    mimeType: "application/pdf",
    fileName,
  };
}

/** @deprecated Use generateResumePdfFromJson — kept for earlier stub compatibility. */
export async function generateResumePdf(): Promise<never> {
  throw new Error(
    "Use generateResumePdfFromJson with stored ResumeJson. Profile remapping is not allowed for PDF download.",
  );
}

export async function uploadResumePdf(): Promise<never> {
  throw new Error(
    "Resume PDF upload is not implemented. Download streams PDF bytes directly.",
  );
}
