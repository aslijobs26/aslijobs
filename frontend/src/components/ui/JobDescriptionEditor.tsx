"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/utils/cn";
import {
  getJobDescriptionPlainTextLength,
  normalizeJobDescriptionHtml,
} from "@/utils/job-description-html";

type JobDescriptionEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  hasError?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border text-muted transition-colors",
        "hover:border-primary/30 hover:bg-hero-bg hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active && "border-primary/40 bg-primary-light text-primary",
        !active && "border-transparent bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

export function JobDescriptionEditor({
  id,
  value,
  onChange,
  maxLength,
  placeholder = "Describe the job role, responsibilities and requirements.",
  hasError = false,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
}: JobDescriptionEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-invalid": ariaInvalid ? "true" : "false",
        ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
        class: cn(
          "min-h-[8.5rem] max-h-[22rem] overflow-y-auto px-3.5 py-3 text-sm leading-relaxed text-foreground outline-none",
          "[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold",
          "[&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold",
          "[&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold",
          "[&_h4]:mb-1.5 [&_h4]:text-sm [&_h4]:font-semibold",
          "[&_h5]:mb-1 [&_h5]:text-sm [&_h5]:font-medium",
          "[&_h6]:mb-1 [&_h6]:text-xs [&_h6]:font-medium [&_h6]:uppercase [&_h6]:tracking-wide",
          "[&_p]:mb-2 [&_p]:last:mb-0",
          "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_li]:mb-0.5",
          "[&_a]:text-primary [&_a]:underline",
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_p.is-editor-empty:first-child::before]:float-left",
          "[&_p.is-editor-empty:first-child::before]:h-0",
          "[&_p.is-editor-empty:first-child::before]:text-muted",
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        ),
      },
      handlePaste: (view, event) => {
        const pasted = event.clipboardData?.getData("text/plain") ?? "";
        if (!pasted) {
          return false;
        }
        const { from, to } = view.state.selection;
        const selected = view.state.doc.textBetween(from, to, "").length;
        const current = view.state.doc.textContent.length;
        const room = maxLength - (current - selected);
        if (room <= 0) {
          event.preventDefault();
          return true;
        }
        if (pasted.length > room) {
          event.preventDefault();
          const { tr } = view.state;
          tr.insertText(pasted.slice(0, room), from, to);
          view.dispatch(tr);
          return true;
        }
        return false;
      },
      handleTextInput: (view, from, to, text) => {
        const selected = view.state.doc.textBetween(from, to, "").length;
        const current = view.state.doc.textContent.length;
        if (current - selected + text.length > maxLength) {
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const chars = currentEditor.storage.characterCount.characters() as number;
      if (chars > maxLength) {
        return;
      }
      onChange(normalizeJobDescriptionHtml(currentEditor.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = normalizeJobDescriptionHtml(editor.getHTML());
    const incoming = normalizeJobDescriptionHtml(value);
    if (current === incoming) {
      return;
    }
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  const characterCount = editor
    ? (editor.storage.characterCount.characters() as number)
    : getJobDescriptionPlainTextLength(value);

  const setLink = () => {
    if (!editor) {
      return;
    }
    const previous = editor.getAttributes("link").href as string | undefined;
    const next = window.prompt("Enter URL", previous ?? "https://");
    if (next === null) {
      return;
    }
    const trimmed = next.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-md border bg-surface transition-colors",
          hasError
            ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
            : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border-subtle bg-hero-bg/50 px-1.5 py-1.5">
          <ToolbarButton
            label="Heading 1"
            active={editor?.isActive("heading", { level: 1 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 2"
            active={editor?.isActive("heading", { level: 2 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editor?.isActive("heading", { level: 3 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 4"
            active={editor?.isActive("heading", { level: 4 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 4 }).run()
            }
          >
            <span className="text-[10px] font-bold tracking-wide">H4</span>
          </ToolbarButton>
          <ToolbarButton
            label="Heading 5"
            active={editor?.isActive("heading", { level: 5 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 5 }).run()
            }
          >
            <span className="text-[10px] font-bold tracking-wide">H5</span>
          </ToolbarButton>
          <ToolbarButton
            label="Heading 6"
            active={editor?.isActive("heading", { level: 6 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 6 }).run()
            }
          >
            <span className="text-[10px] font-bold tracking-wide">H6</span>
          </ToolbarButton>
          <ToolbarButton
            label="Paragraph"
            active={editor?.isActive("paragraph")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().setParagraph().run()}
          >
            <span className="text-[10px] font-bold tracking-wide">P</span>
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border-subtle" aria-hidden="true" />
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor?.isActive("underline")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border-subtle" aria-hidden="true" />
          <ToolbarButton
            label="Bullet list"
            active={editor?.isActive("bulletList")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor?.isActive("orderedList")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            active={editor?.isActive("link")}
            disabled={!editor}
            onClick={setLink}
          >
            <Link2 className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} />
      </div>
      <p
        id={ariaDescribedBy}
        className={cn(
          "mt-1 text-right text-xs",
          characterCount > maxLength ? "text-red-600" : "text-muted",
        )}
      >
        {characterCount}/{maxLength}
      </p>
    </div>
  );
}
