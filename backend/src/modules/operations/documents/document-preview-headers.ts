export type DocumentDisposition = "inline" | "attachment";

function safeFileName(fileName: string): string {
  const cleaned = fileName.replace(/["\r\n]/g, "").trim();
  return cleaned || "document";
}

export function isPdfDocumentFile(fileName: string, mimeType: string): boolean {
  const mime = mimeType.trim().toLowerCase();
  const name = fileName.trim().toLowerCase();
  return mime.includes("pdf") || name.endsWith(".pdf");
}

export function resolveDocumentFileHeaders(input: {
  mimeType: string;
  fileName: string;
  disposition: DocumentDisposition;
}): { contentType: string; contentDisposition: string } {
  const fileName = safeFileName(input.fileName);
  const storedMime = input.mimeType.trim() || "application/octet-stream";
  const contentType = isPdfDocumentFile(fileName, storedMime)
    ? "application/pdf"
    : storedMime;
  return {
    contentType,
    contentDisposition: `${input.disposition}; filename="${fileName}"`,
  };
}
