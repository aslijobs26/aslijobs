export type DocumentPreviewKind = "pdf" | "image" | "unsupported";

const PDF_MAGIC = "%PDF";

export function isPdfDocumentFile(fileName: string, mimeType?: string): boolean {
  const mime = (mimeType ?? "").trim().toLowerCase();
  const name = fileName.trim().toLowerCase();
  return mime.includes("pdf") || name.endsWith(".pdf");
}

export function detectDocumentPreviewKind(
  fileName: string,
  mimeType?: string,
): DocumentPreviewKind {
  if (isPdfDocumentFile(fileName, mimeType)) {
    return "pdf";
  }
  const mime = (mimeType ?? "").toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(fileName)) {
    return "image";
  }
  return "unsupported";
}

export function isJsonOrHtmlBlob(blob: Blob, contentTypeHeader?: string): boolean {
  const header = (contentTypeHeader ?? "").toLowerCase();
  const type = blob.type.toLowerCase();
  return (
    header.includes("application/json") ||
    header.includes("text/html") ||
    type.includes("application/json") ||
    type.includes("text/html")
  );
}

export function fileNameFromContentDisposition(header: unknown): string {
  if (typeof header !== "string") {
    return "document";
  }
  const filenameMatch = /filename="?([^"]+)"?/i.exec(header);
  return filenameMatch?.[1]?.trim() || "document";
}

export function previewErrorMessageFromStatus(status?: number): string {
  if (status === 401) {
    return "Your session expired. Sign in again to preview this document.";
  }
  if (status === 403) {
    return "You do not have permission to preview this document.";
  }
  if (status === 404) {
    return "This document could not be found.";
  }
  if (status === 410) {
    return "This document link is no longer available.";
  }
  return "Unable to preview this document.";
}

export async function normalizeDocumentBlobForPreview(
  blob: Blob,
  fileName: string,
  contentTypeHeader?: string,
): Promise<Blob> {
  if (isJsonOrHtmlBlob(blob, contentTypeHeader)) {
    throw new Error("invalid_document_response");
  }

  const kind = detectDocumentPreviewKind(fileName, contentTypeHeader || blob.type);
  if (kind !== "pdf") {
    return blob;
  }

  const bytes = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const header = String.fromCharCode(...bytes);
  if (bytes.length > 0 && !header.startsWith(PDF_MAGIC)) {
    throw new Error("invalid_pdf");
  }

  if (blob.type === "application/pdf") {
    return blob;
  }

  return new Blob([blob], { type: "application/pdf" });
}
