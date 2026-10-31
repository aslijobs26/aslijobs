import PDFDocument from "pdfkit";
import { extractDocumentText } from "../src/modules/whatsapp/whatsapp-media-extract.js";

async function buildTextPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(14).text(
      "Resume\nSkills: React, Node, TypeScript\nExperience: 3 years\nEducation: B.Tech",
    );
    doc.end();
  });
}

const buffer = await buildTextPdf();
const result = await extractDocumentText({
  buffer,
  mimeType: "application/pdf",
  fileName: "resume.pdf",
  allowOcr: false,
});
console.log(`pdf_digital_ok=${result.ok ? "yes" : "no"}`);
if (result.ok) {
  console.log(`pdf_digital_source=${result.source}`);
  console.log(`pdf_digital_has_react=${/react/i.test(result.text) ? "yes" : "no"}`);
  console.log(`pdf_digital_chars=${result.text.length}`);
} else {
  console.log(`pdf_digital_reason=${result.reason}`);
  process.exitCode = 1;
}
