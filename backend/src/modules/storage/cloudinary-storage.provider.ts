import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import type {
  StorageDeleteInput,
  StorageProvider,
  StorageReplaceInput,
  StorageUploadInput,
  StoredFileResult,
} from "./storage.types.js";

function sanitizeFileName(originalName: string): string {
  return originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function resolveResourceType(
  mimeType: string,
): "image" | "raw" | "video" | "auto" {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType === "application/pdf") {
    return "raw";
  }

  return "auto";
}

export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = "cloudinary" as const;

  constructor() {
    if (
      !env.CLOUDINARY_CLOUD_NAME ||
      !env.CLOUDINARY_API_KEY ||
      !env.CLOUDINARY_API_SECRET
    ) {
      throw new AppError(
        "Cloudinary storage is selected but credentials are incomplete.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  private buildFolder(folder?: string): string {
    const root = env.CLOUDINARY_ROOT_FOLDER.replace(/^\/+|\/+$/g, "");
    const relative = (folder ?? "employer-documents").replace(/^\/+|\/+$/g, "");
    return `${root}/${relative}`;
  }

  private async uploadBuffer(
    input: StorageUploadInput,
  ): Promise<UploadApiResponse> {
    const folder = this.buildFolder(input.folder);
    const baseName = (input.fileBaseName ?? "document")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");
    const publicId = `${baseName}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const resourceType = resolveResourceType(input.mimeType);

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: resourceType,
          overwrite: false,
          unique_filename: false,
          use_filename: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new AppError(
                error?.message || "Upload failed",
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
              ),
            );
            return;
          }

          resolve(result);
        },
      );

      Readable.from(input.buffer).pipe(stream);
    });
  }

  async upload(input: StorageUploadInput): Promise<StoredFileResult> {
    try {
      const result = await this.uploadBuffer(input);
      const extension = path.extname(input.originalName);
      const storedName = `${path.basename(result.public_id)}${extension}`;

      return {
        storedName,
        storagePath: result.public_id,
        storageProvider: "cloudinary",
        publicId: result.public_id,
        url: result.secure_url,
        bucketName: env.CLOUDINARY_CLOUD_NAME,
        mimeType: input.mimeType,
        fileSize: input.buffer.length,
        originalName: sanitizeFileName(input.originalName),
        folder: this.buildFolder(input.folder),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Upload failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(input: StorageDeleteInput): Promise<void> {
    const publicId = input.publicId || input.storagePath;

    if (!publicId) {
      return;
    }

    const preferred = input.mimeType
      ? resolveResourceType(input.mimeType)
      : "auto";
    const resourceTypes: Array<"image" | "raw" | "video"> =
      preferred === "auto"
        ? ["image", "raw", "video"]
        : preferred === "image"
          ? ["image", "raw", "video"]
          : preferred === "raw"
            ? ["raw", "image", "video"]
            : ["video", "image", "raw"];

    let lastError: unknown;

    for (const resourceType of resourceTypes) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true,
        });

        if (result.result === "ok" || result.result === "not found") {
          return;
        }

        lastError = result;
      } catch (error) {
        lastError = error;
      }
    }

    console.error("Cloudinary delete failed:", lastError);
    throw new AppError(
      "Failed to delete Cloudinary asset",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  async replace(input: StorageReplaceInput): Promise<StoredFileResult> {
    await this.delete(input.previous);
    return this.upload(input.upload);
  }

  getPublicUrl(
    file: Pick<StoredFileResult, "storagePath" | "publicId" | "url">,
  ): string {
    if (file.url) {
      return file.url;
    }

    const publicId = file.publicId || file.storagePath;
    return cloudinary.url(publicId, { secure: true });
  }
}
