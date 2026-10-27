import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Languages } from "lucide-react";
import {
  INBOX_TRANSLATION_LANGUAGE_OPTIONS,
  inboxLanguageDisplayName,
  type InboxTranslationLanguage,
  type InboxViewLanguage,
} from "../../../constants/inbox-translation-languages";
import { cn } from "../../../utils/cn";
import { placeAnchoredMenu } from "../../../utils/anchored-menu";
import { useOperationsTheme } from "../../../providers/theme-provider";

interface InboxTranslateMenuProps {
  language: InboxViewLanguage;
  disabled?: boolean;
  onSelect: (language: InboxViewLanguage) => void;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT = 320;

export function InboxTranslateMenu({
  language,
  disabled = false,
  onSelect,
}: InboxTranslateMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const { theme } = useOperationsTheme();
  const isDark = theme === "dark";
  const menuStyle = useAnchoredMenuStyle(open, buttonRef, "below");

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const label =
    language === "original"
      ? "Translate"
      : inboxLanguageDisplayName(language);

  const idleClass = isDark
    ? "text-[#aebac1] @min-[40rem]/inbox-chat:border-[#2a3942] @min-[40rem]/inbox-chat:text-[#e9edef]"
    : "text-[#54656f] @min-[40rem]/inbox-chat:border-border @min-[40rem]/inbox-chat:text-foreground";
  const activeClass = isDark
    ? "bg-[#005c4b] text-[#e9edef] @min-[40rem]/inbox-chat:border-[#00a884]"
    : "bg-[#e7fce3] text-[#008069] @min-[40rem]/inbox-chat:border-[#00a884]";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Translate conversation"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full @min-[40rem]/inbox-chat:h-9 @min-[40rem]/inbox-chat:w-auto @min-[40rem]/inbox-chat:gap-1.5 @min-[40rem]/inbox-chat:rounded-lg @min-[40rem]/inbox-chat:border @min-[40rem]/inbox-chat:px-2.5 @min-[40rem]/inbox-chat:text-xs @min-[40rem]/inbox-chat:font-medium disabled:cursor-not-allowed disabled:opacity-60",
          language === "original" ? idleClass : activeClass,
        )}
      >
        <Languages className="size-4" aria-hidden="true" />
        <span className="hidden @min-[40rem]/inbox-chat:inline">{label}</span>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label="Translation language"
              style={menuStyle}
              className={cn(
                "overflow-y-auto rounded-lg border shadow-lg",
                isDark
                  ? "border-[#2a3942] bg-[#202c33] text-[#e9edef]"
                  : "border-[#e9edef] bg-white text-[#111b21]",
              )}
            >
              <button
                type="button"
                role="menuitemradio"
                aria-checked={language === "original"}
                className={cn(
                  "flex w-full px-3 py-2.5 text-left text-xs font-medium hover:bg-[#f0f2f5]",
                  isDark && "hover:bg-[#2a3942]",
                  language === "original" && "text-[#00a884]",
                )}
                onClick={() => {
                  onSelect("original");
                  setOpen(false);
                }}
              >
                Show original
              </button>
              <div
                className={cn(
                  "border-t px-3 py-1 text-[10px] uppercase tracking-wide",
                  isDark
                    ? "border-[#2a3942] text-[#8696a0]"
                    : "border-[#e9edef] text-[#667781]",
                )}
              >
                Translate to
              </div>
              {INBOX_TRANSLATION_LANGUAGE_OPTIONS.map((option) => {
                const selected = language === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    className={cn(
                      "flex w-full items-baseline justify-between gap-2 px-3 py-2.5 text-left text-xs hover:bg-[#f0f2f5]",
                      isDark && "hover:bg-[#2a3942]",
                      selected && "font-semibold text-[#00a884]",
                    )}
                    onClick={() => {
                      onSelect(option.code);
                      setOpen(false);
                    }}
                  >
                    <span>{option.nativeLabel}</span>
                    <span
                      className={cn(
                        "text-[10px]",
                        isDark ? "text-[#8696a0]" : "text-[#667781]",
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

interface InboxDraftLanguageMenuProps {
  open: boolean;
  onSelect: (language: InboxTranslationLanguage) => void;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
}

export function InboxDraftLanguageMenu({
  open,
  onSelect,
  onClose,
  anchorRef,
}: InboxDraftLanguageMenuProps) {
  const { theme } = useOperationsTheme();
  const isDark = theme === "dark";
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuStyle = useAnchoredMenuStyle(open, anchorRef, "above", 200, 260);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Recipient language"
      style={menuStyle}
      className={cn(
        "overflow-y-auto rounded-lg border shadow-lg",
        isDark
          ? "border-[#2a3942] bg-[#202c33] text-[#e9edef]"
          : "border-[#e9edef] bg-white text-[#111b21]",
      )}
    >
      {INBOX_TRANSLATION_LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          role="menuitem"
          className={cn(
            "flex w-full items-baseline justify-between gap-2 px-3 py-2.5 text-left text-xs hover:bg-[#f0f2f5]",
            isDark && "hover:bg-[#2a3942]",
          )}
          onClick={() => onSelect(option.code)}
        >
          <span>{option.nativeLabel}</span>
          <span className={cn("text-[10px]", isDark ? "text-[#8696a0]" : "text-[#667781]")}>
            {option.label}
          </span>
        </button>
      ))}
    </div>,
    document.body,
  );
}

function useAnchoredMenuStyle(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  prefer: "below" | "above",
  width = MENU_WIDTH,
  height = MENU_HEIGHT,
) {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const node = anchorRef.current;
      if (!node) return;
      const position = placeAnchoredMenu(
        node.getBoundingClientRect(),
        { width, height },
        prefer,
      );
      setStyle({
        position: "fixed",
        top: position.top,
        left: position.left,
        width: Math.min(width, window.innerWidth - 16),
        maxHeight: Math.min(height, window.innerHeight - 16),
        zIndex: 80,
      });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, prefer, width, height]);

  return style;
}
