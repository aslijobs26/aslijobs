import PDFDocument from "pdfkit";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

/**
 * Smoke: render a text PDF page to PNG via pdf-parse getScreenshot,
 * then OCR with tesseract.js (same path as scanned-PDF pipeline).
 */
async function buildTextPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(28).text("ASLIJOBS OCR SMOKE React Developer Hyderabad");
    doc.end();
  });
}

const started = Date.now();
const pdf = await buildTextPdf();
const parser = new PDFParse({ data: pdf });
try {
  const shot = await parser.getScreenshot({
    scale: 1.5,
    imageBuffer: true,
    imageDataUrl: false,
    first: 1,
  });
  const page = shot.pages?.[0]?.data;
  if (!page) {
    console.log("pdf_ocr_smoke=failed");
    console.log("pdf_ocr_reason=no_screenshot");
    process.exitCode = 1;
  } else {
    const buffer = Buffer.isBuffer(page) ? page : Buffer.from(page);
    const worker = await createWorker("eng");
    const recognized = await worker.recognize(buffer);
    await worker.terminate();
    const text = (recognized.data?.text || "").trim();
    console.log("pdf_ocr_smoke=ok");
    console.log(`pdf_ocr_chars=${text.length}`);
    console.log(`pdf_ocr_has_react=${/react/i.test(text) ? "yes" : "no"}`);
    console.log(`pdf_ocr_ms=${Date.now() - started}`);
  }
} catch (error) {
  console.log("pdf_ocr_smoke=failed");
  console.log(
    `pdf_ocr_error=${error instanceof Error ? error.name : "unknown"}`,
  );
  process.exitCode = 1;
} finally {
  await parser.destroy().catch(() => undefined);
}
