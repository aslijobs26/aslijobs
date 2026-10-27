import { LoaderCircle } from "lucide-react";
import type { InboxMessageTranslationItem } from "../../../types/operations-whatsapp-inbox";
import { cn } from "../../../utils/cn";
import { useOperationsTheme } from "../../../providers/theme-provider";

interface InboxTranslatedBodyProps {
  originalBody: string;
  translation: (InboxMessageTranslationItem & { loading?: boolean }) | null;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  onRetry: () => void;
}

const MESSAGE_TEXT_CLASS =
  "whitespace-pre-wrap break-words [overflow-wrap:anywhere]";

export function InboxTranslatedBody({
  originalBody,
  translation,
  showOriginal,
  onToggleOriginal,
  onRetry,
}: InboxTranslatedBodyProps) {
  const { theme } = useOperationsTheme();
  const isDark = theme === "dark";
  const muted = isDark ? "text-[#8696a0]" : "text-[#667781]";

  if (!translation) {
    return <p className={MESSAGE_TEXT_CLASS}>{originalBody}</p>;
  }

  if (translation.loading && !translation.translatedText) {
    return (
      <div className="space-y-1">
        <p className={cn(MESSAGE_TEXT_CLASS, "opacity-70")}>{originalBody}</p>
        <p className={cn("inline-flex items-center gap-1 text-[11px]", muted)}>
          <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
          Translating…
        </p>
      </div>
    );
  }

  if (translation.status === "failed") {
    return (
      <div className="space-y-1">
        <p className={MESSAGE_TEXT_CLASS}>{originalBody}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-[11px] font-medium text-[#027eb5] underline"
        >
          Retry translation
        </button>
      </div>
    );
  }

  if (
    translation.status === "skipped" ||
    translation.status === "same_language" ||
    !translation.translatedText
  ) {
    return <p className={MESSAGE_TEXT_CLASS}>{originalBody}</p>;
  }

  const displayText = showOriginal ? originalBody : translation.translatedText;

  return (
    <div className="space-y-1">
      <p className={MESSAGE_TEXT_CLASS}>{displayText}</p>
      <button
        type="button"
        onClick={onToggleOriginal}
        className={cn("text-[11px] font-medium underline", muted)}
      >
        {showOriginal ? "Show translation" : "Show original"}
      </button>
    </div>
  );
}
