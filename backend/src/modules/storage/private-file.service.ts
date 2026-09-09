import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { StorageProviderName } from "./storage.types.js";

export type PrivateFileRef = {
  storagePath?: string | null;
  storageProvider?: string | null;
  publicId?: string | null;
  /** Legacy stored URL — used only for server-side fetch, never returned to clients. */
  url?: string | null;
  mimeType?: string | null;
  originalName?: string | null;
};

const SENSITIVE_UPLOAD_PREFIXES = [
  "resumes/",
  "job-seekers/",
  "employer-documents/",
  "individual-documents/",
] as const;

/**
 * Local public static must not expose these prefixes.
 * Employer logos / company assets remain publicly cacheable.
 */
export function isSensitiveUploadPublicPath(requestPath: string): boolean {
  const normalized = requestPath.replace(/^\/+/, "").replace(/\\/g, "/");
  const withoutUploads = normalized.startsWith(`${env.UPLOAD_DIR}/`)
    ? normalized.slice(env.UPLOAD_DIR.length + 1)
    : normalized;
  return SENSITIVE_UPLOAD_PREFIXES.some(
    (prefix) =>
      withoutUploads === prefix.slice(0, -1) ||
      withoutUploads.startsWith(prefix),
  );
}

function resolveLocalAbsolutePath(storagePath: string): string {
  const absolute = path.isAbsolute(storagePath)
    ? path.normalize(storagePath)
    : path.resolve(process.cwd(), storagePath);
  const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
  const relative = path.relative(uploadRoot, absolute);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative.includes("\0")
  ) {
    throw new AppError("File not found", HTTP_STATUS.NOT_FOUND);
  }
  return absolute;
}

function providerOf(ref: PrivateFileRef): StorageProviderName {
  return ref.storageProvider === "cloudinary" ? "cloudinary" : "local";
}

async function readCloudinaryOrRemote(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError("File not found", HTTP_STATUS.NOT_FOUND);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Reads a private stored file for authorized streaming.
 * Never trusts client paths — only server-owned storagePath/url refs.
 */
export async function readPrivateFileBuffer(
  ref: PrivateFileRef,
): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
  const mimeType = ref.mimeType?.trim() || "application/octet-stream";
  const fileName = (ref.originalName?.trim() || "file").replace(/"/g, "");
  const storagePath = ref.storagePath?.trim() || "";
  const remoteUrl = ref.url?.trim() || "";

  if (providerOf(ref) === "local" || storagePath) {
    if (storagePath) {
      const absolute = resolveLocalAbsolutePath(storagePath);
      if (!existsSync(absolute)) {
        throw new AppError("File not found", HTTP_STATUS.NOT_FOUND);
      }
      const buffer = await readFile(absolute);
      return { buffer, mimeType, fileName };
    }
  }

  if (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://")) {
    const buffer = await readCloudinaryOrRemote(remoteUrl);
    return { buffer, mimeType, fileName };
  }

  if (remoteUrl.startsWith("/")) {
    const absolute = resolveLocalAbsolutePath(remoteUrl.replace(/^\/+/, ""));
    if (!existsSync(absolute)) {
      throw new AppError("File not found", HTTP_STATUS.NOT_FOUND);
    }
    const buffer = await readFile(absolute);
    return { buffer, mimeType, fileName };
  }

  throw new AppError("File not found", HTTP_STATUS.NOT_FOUND);
}

export async function openPrivateFileStream(
  ref: PrivateFileRef,
): Promise<{
  stream: Readable;
  mimeType: string;
  fileName: string;
  contentLength?: number;
}> {
  const mimeType = ref.mimeType?.trim() || "application/octet-stream";
  const fileName = (ref.originalName?.trim() || "file").replace(/"/g, "");
  const storagePath = ref.storagePath?.trim() || "";

  if (storagePath && providerOf(ref) === "local") {
    const absolute = resolveLocalAbsolutePath(storagePath);
    if (!existsSync(absolute)) {
      throw new AppError("File not found", HTTP_STATUS.NOT_FOUND);
    }
    return {
      stream: createReadStream(absolute),
      mimeType,
      fileName,
    };
  }

  const { buffer } = await readPrivateFileBuffer(ref);
  const { Readable } = await import("node:stream");
  return {
    stream: Readable.from(buffer),
    mimeType,
    fileName,
    contentLength: buffer.length,
  };
}

export function hasPrivateFile(ref: PrivateFileRef | null | undefined): boolean {
  if (!ref) {
    return false;
  }
  return Boolean(ref.storagePath?.trim() || ref.url?.trim());
}
