export type OperationsJobPreviewLanguageCode =
  | "en"
  | "hi"
  | "te"
  | "ta"
  | "kn"
  | "ml";

export type OperationsJobPreviewLanguageOption = {
  code: OperationsJobPreviewLanguageCode;
  label: string;
  englishLabel: string;
};

export const OPERATIONS_JOB_PREVIEW_LANGUAGES: readonly OperationsJobPreviewLanguageOption[] =
  [
    { code: "en", label: "English", englishLabel: "English" },
    { code: "te", label: "తెలుగు", englishLabel: "Telugu" },
    { code: "hi", label: "हिंदी", englishLabel: "Hindi" },
    { code: "ta", label: "தமிழ்", englishLabel: "Tamil" },
    { code: "kn", label: "ಕನ್ನಡ", englishLabel: "Kannada" },
    { code: "ml", label: "മലയാളം", englishLabel: "Malayalam" },
  ] as const;

export function operationsJobPreviewLanguageLabel(
  code: OperationsJobPreviewLanguageCode,
): string {
  return (
    OPERATIONS_JOB_PREVIEW_LANGUAGES.find((option) => option.code === code)
      ?.label ?? code
  );
}
