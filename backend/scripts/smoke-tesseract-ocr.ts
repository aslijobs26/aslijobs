import { createWorker } from "tesseract.js";

/** Minimal valid 1x1 PNG — OCR text expected empty. */
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const started = Date.now();
try {
  const worker = await createWorker("eng");
  const result = await worker.recognize(png);
  await worker.terminate();
  const text = (result.data?.text || "").trim();
  console.log("tesseract_smoke=ok");
  console.log(`tesseract_chars=${text.length}`);
  console.log(`tesseract_ms=${Date.now() - started}`);
} catch (error) {
  console.log("tesseract_smoke=failed");
  console.log(
    `tesseract_error=${
      error instanceof Error
        ? `${error.name}:${error.message.slice(0, 120)}`
        : "unknown"
    }`,
  );
  process.exitCode = 1;
}
