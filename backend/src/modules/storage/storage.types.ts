export type StorageProviderName = "local" | "cloudinary";

export type StoredFileResult = {
  storedName: string;
  storagePath: string;
  storageProvider: StorageProviderName;
  /** Cloudinary public_id (empty for local). */
  publicId?: string;
  /** Publicly accessible URL when available. */
  url?: string;
  /** Legacy/cloud identifier (local unused; Cloudinary cloud name). */
  bucketName?: string;
  mimeType: string;
  fileSize: number;
  originalName: string;
  folder?: string;
};

export type StorageUploadInput = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
  /** Optional base name (without extension) used in the unique stored filename. */
  fileBaseName?: string;
};

export type StorageDeleteInput = {
  storagePath: string;
  storageProvider: StorageProviderName;
  publicId?: string;
  mimeType?: string;
};

export type StorageReplaceInput = {
  previous: StorageDeleteInput;
  upload: StorageUploadInput;
};

export interface StorageProvider {
  readonly name: StorageProviderName;
  upload(input: StorageUploadInput): Promise<StoredFileResult>;
  delete(input: StorageDeleteInput): Promise<void>;
  replace(input: StorageReplaceInput): Promise<StoredFileResult>;
  getPublicUrl(file: Pick<StoredFileResult, "storagePath" | "publicId" | "url">): string;
}
