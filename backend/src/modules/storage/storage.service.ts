import { createStorageProvider } from "./storage.factory.js";
import type {
  StorageDeleteInput,
  StorageReplaceInput,
  StorageUploadInput,
  StoredFileResult,
} from "./storage.types.js";

export class StorageService {
  async upload(input: StorageUploadInput): Promise<StoredFileResult> {
    const provider = createStorageProvider();
    return provider.upload(input);
  }

  async delete(input: StorageDeleteInput): Promise<void> {
    const provider = createStorageProvider();
    return provider.delete(input);
  }

  async replace(input: StorageReplaceInput): Promise<StoredFileResult> {
    const provider = createStorageProvider();
    return provider.replace(input);
  }

  getPublicUrl(
    file: Pick<StoredFileResult, "storagePath" | "publicId" | "url">,
  ): string {
    const provider = createStorageProvider();
    return provider.getPublicUrl(file);
  }
}

export const storageService = new StorageService();
