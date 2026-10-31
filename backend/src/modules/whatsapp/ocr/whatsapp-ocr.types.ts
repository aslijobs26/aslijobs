export type OcrErrorCode =
  | "disabled"
  | "unsupported_image"
  | "too_large"
  | "dimensions"
  | "empty"
  | "timeout"
  | "provider_error"
  | "encrypted"
  | "too_many_pages";

export type OcrResult =
  | {
      ok: true;
      text: string;
      truncated: boolean;
      languageHint: string;
      provider: string;
      durationMs: number;
      pageCount?: number;
    }
  | {
      ok: false;
      errorCode: OcrErrorCode;
      provider: string;
      durationMs: number;
    };

export type OcrImageInput = {
  buffer: Buffer;
  mimeType: string;
  /** Soft language hint (e.g. eng+hin). */
  languages?: string;
  timeoutMs?: number;
  maxTextChars?: number;
};

export interface WhatsAppOcrProvider {
  readonly name: string;
  recognizeImage(input: OcrImageInput): Promise<OcrResult>;
}
