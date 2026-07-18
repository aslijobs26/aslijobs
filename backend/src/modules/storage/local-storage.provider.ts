import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error.middleware.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
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

function resolveAbsolutePath(storagePath: string): string {
  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }

  return path.resolve(process.cwd(), storagePath);
}

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;

  async upload(input: StorageUploadInput): Promise<StoredFileResult> {
    const folder = input.folder ?? "employer-documents";
    const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR, folder);
    await mkdir(uploadRoot, { recursive: true });

    const extension = path.extname(input.originalName);
    const baseName = (input.fileBaseName ?? "document")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");
    const storedName = `${baseName}-${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
    const absolutePath = path.join(uploadRoot, storedName);
    const relativePath = path
      .join(env.UPLOAD_DIR, folder, storedName)
      .replace(/\\/g, "/");

    await writeFile(absolutePath, input.buffer);

    return {
      storedName,
      storagePath: relativePath,
      storageProvider: "local",
      publicId: "",
      url: `/${relativePath}`,
      mimeType: input.mimeType,
      fileSize: input.buffer.length,
      originalName: sanitizeFileName(input.originalName),
      folder,
    };
  }

  async delete(input: StorageDeleteInput): Promise<void> {
    try {
      await unlink(resolveAbsolutePath(input.storagePath));
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code)
          : "";

      if (code === "ENOENT") {
        return;
      }

      throw new AppError(
        "Failed to delete local file",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async replace(input: StorageReplaceInput): Promise<StoredFileResult> {
    try {
      await this.delete(input.previous);
    } catch {
      // Continue with upload even if previous file is already gone.
    }

    return this.upload(input.upload);
  }

  getPublicUrl(
    file: Pick<StoredFileResult, "storagePath" | "publicId" | "url">,
  ): string {
    if (file.url) {
      return file.url;
    }

    return `/${file.storagePath.replace(/\\/g, "/")}`;
  }
}
