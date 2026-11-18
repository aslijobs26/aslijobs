import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Megaphone,
  MessageSquareText,
  Quote,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Video,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

type BlogRichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
};

export function BlogRichTextEditor({ value, onChange, onUploadImage }: BlogRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: false }),
      Youtube.configure({ nocookie: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "Write the article…" }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-72 px-3 py-3 text-sm leading-7 text-foreground focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  useEffect(() => {
    if (!editor || !value) return;
    const current = editor.getHTML();
    if (current === "<p></p>" || current === "") {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  async function addImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      const url = await onUploadImage(file);
      const alt = window.prompt("Image description", "") ?? "";
      editor.chain().focus().setImage({ src: url, alt }).run();
    };
    input.click();
  }

  function addYoutube() {
    const url = window.prompt("YouTube URL");
    if (!url || !editor) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }

  function addLink() {
    const href = window.prompt("Link URL", "https://");
    if (!href || !editor) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  return (
    <div className="blog-editor overflow-hidden rounded-xl border border-border-subtle bg-white">
      <div className="flex flex-col gap-1 border-b border-border-subtle bg-hero-bg/70 px-1.5 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="size-3.5" />
          </ToolButton>
          <ToolButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="size-3.5" />
          </ToolButton>
          <ToolButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="size-3.5" />
          </ToolButton>
          <ToolbarDivider />
          <ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="size-3.5" />
          </ToolButton>
          <ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="size-3.5" />
          </ToolButton>
          <ToolButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="size-3.5" />
          </ToolButton>
          <ToolbarDivider />
          <ToolButton label="Bullets" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="size-3.5" />
          </ToolButton>
          <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="size-3.5" />
          </ToolButton>
          <ToolButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="size-3.5" />
          </ToolButton>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <ToolButton label="Link" showLabel active={editor.isActive("link")} onClick={addLink}>
            <Link2 className="size-3.5" />
          </ToolButton>
          <ToolButton label="Image" showLabel onClick={() => void addImage()}>
            <ImageIcon className="size-3.5" />
          </ToolButton>
          <ToolButton label="YouTube" showLabel onClick={addYoutube}>
            <Video className="size-3.5" />
          </ToolButton>
          <ToolButton label="Table" showLabel onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="size-3.5" />
          </ToolButton>
          <ToolButton label="Callout" showLabel onClick={() => editor.chain().focus().insertContent('<div class="blog-callout"><p>Callout</p></div>').run()}>
            <MessageSquareText className="size-3.5" />
          </ToolButton>
          <ToolButton label="CTA" showLabel onClick={() => editor.chain().focus().insertContent('<div class="blog-cta"><p>Call to action</p></div>').run()}>
            <Megaphone className="size-3.5" />
          </ToolButton>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolButton({
  label,
  showLabel,
  active,
  onClick,
  children,
}: {
  label: string;
  showLabel?: boolean;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-8 items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition-colors ${showLabel ? "px-1.5" : "size-8"} ${active ? "bg-white text-primary shadow-sm ring-1 ring-primary/25" : "text-foreground hover:bg-white"}`}
    >
      {children}
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden="true" />;
}
