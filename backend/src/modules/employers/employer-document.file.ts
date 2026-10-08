import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";
import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EmployerDocumentModel } from "./employer-document.model.js";

export type OpenEmployerDocumentFileResult = {
  stream: Readable;
  mimeType: string;
  fileName: string;
  contentLength?: number;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function openEmployerDocumentFile(input: {
  employerId: string;
  documentId: string;
}): Promise<OpenEmployerDocumentFileResult> {
  if (
    !mongoose.Types.ObjectId.isValid(input.employerId) ||
    !mongoose.Types.ObjectId.isValid(input.documentId)
  ) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  }

  const document = await EmployerDocumentModel.findOne({
    _id: new mongoose.Types.ObjectId(input.documentId),
    employerId: new mongoose.Types.ObjectId(input.employerId),
  }).lean();

  if (!document) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
  }

  const fileName = text(document.originalName) || "document";
  const mimeType = text(document.mimeType) || "application/octet-stream";
  const storagePath = text(document.storagePath);
  const remoteUrl = text(document.url);

  if (storagePath) {
    const absolutePath = path.isAbsolute(storagePath)
      ? storagePath
      : path.resolve(process.cwd(), storagePath);
    if (existsSync(absolutePath)) {
      return {
        stream: createReadStream(absolutePath),
        mimeType,
        fileName,
        contentLength:
          typeof document.fileSize === "number" ? document.fileSize : undefined,
      };
    }
  }

  if (remoteUrl) {
    const absoluteUrl = remoteUrl.startsWith("http")
      ? remoteUrl
      : remoteUrl.startsWith("/")
        ? remoteUrl
        : `/${remoteUrl}`;

    if (!absoluteUrl.startsWith("http")) {
      const localPath = path.resolve(
        process.cwd(),
        absoluteUrl.replace(/^\//, ""),
      );
      if (!existsSync(localPath)) {
        throw new AppError("Document file not found.", HTTP_STATUS.NOT_FOUND);
      }
      return {
        stream: createReadStream(localPath),
        mimeType,
        fileName,
      };
    }

    const response = await fetch(absoluteUrl);
    if (!response.ok || !response.body) {
      throw new AppError(
        "Unable to load document file.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const { Readable: NodeReadable } = await import("node:stream");
    const stream = NodeReadable.fromWeb(
      response.body as import("stream/web").ReadableStream,
    );
    const contentLengthHeader = response.headers.get("content-length");
    const contentLength = contentLengthHeader
      ? Number(contentLengthHeader)
      : undefined;

    return {
      stream,
      mimeType: response.headers.get("content-type") || mimeType,
      fileName,
      contentLength:
        contentLength != null && Number.isFinite(contentLength)
          ? contentLength
          : undefined,
    };
  }

  throw new AppError("Document file not found.", HTTP_STATUS.NOT_FOUND);
}
