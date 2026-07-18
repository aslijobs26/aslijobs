import { env } from "../../config/env.js";
import { CloudinaryStorageProvider } from "./cloudinary-storage.provider.js";
import { LocalStorageProvider } from "./local-storage.provider.js";
import type { StorageProvider } from "./storage.types.js";

let cachedProvider: StorageProvider | null = null;

export function createStorageProvider(): StorageProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  cachedProvider =
    env.STORAGE_PROVIDER === "cloudinary"
      ? new CloudinaryStorageProvider()
      : new LocalStorageProvider();

  return cachedProvider;
}

/** Clears cached provider — used in tests when env changes. */
export function resetStorageProviderCache(): void {
  cachedProvider = null;
}
