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
import { useEffect, useState, type ReactNode } from "react";

type InsertPanel = "link" | "image" | "youtube" | "table" | "callout" | "cta";

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

  const [panel, setPanel] = useState<InsertPanel | null>(null);
  const [panelError, setPanelError] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const [calloutText, setCalloutText] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  if (!editor) return null;

  function openPanel(next: InsertPanel) {
    if (!editor) return;
    setPanelError("");
    setPanel((current) => (current === next ? null : next));
    if (next === "link") {
      const href = editor.getAttributes("link").href;
      setLinkUrl(typeof href === "string" && href ? href : "https://");
      setLinkText("");
    }
  }

  function closePanel() {
    setPanel(null);
    setPanelError("");
    setImageFile(null);
  }

  function applyLink() {
    if (!editor) return;
    const href = linkUrl.trim();
    if (!/^https?:\/\//i.test(href)) {
      setPanelError("Enter a full link, starting with https://");
      return;
    }
    const text = linkText.trim();
    const chain = editor.chain().focus();
    if (editor.state.selection.empty && text) {
      chain.insertContent(`<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`).run();
    } else if (editor.state.selection.empty) {
      setPanelError("Select text in the article, or type the link text.");
      return;
    } else {
      chain.extendMarkRange("link").setLink({ href }).run();
    }
    closePanel();
  }

  async function applyImage() {
    if (!imageFile) {
      setPanelError("Choose an image file.");
      return;
    }
    setBusy(true);
    setPanelError("");
    try {
      if (!editor) return;
      const url = await onUploadImage(imageFile);
      editor.chain().focus().setImage({ src: url, alt: imageAlt.trim() }).run();
      setImageAlt("");
      closePanel();
    } catch {
      setPanelError("The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  function applyYoutube() {
    if (!editor) return;
    const url = youtubeUrl.trim();
    if (!/(?:youtube\.com|youtu\.be)\//i.test(url)) {
      setPanelError("Paste a YouTube link.");
      return;
    }
    const inserted = editor.chain().focus().setYoutubeVideo({ src: url }).run();
    if (!inserted) {
      setPanelError("That link is not a YouTube video.");
      return;
    }
    setYoutubeUrl("");
    closePanel();
  }

  function applyTable() {
    if (!editor) return;
    const rows = Number(tableRows);
    const cols = Number(tableCols);
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 2 || rows > 8 || cols < 2 || cols > 6) {
      setPanelError("Use 2 to 8 rows and 2 to 6 columns.");
      return;
    }
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    closePanel();
  }

  function applyCallout() {
    if (!editor) return;
    const text = calloutText.trim();
    if (!text) {
      setPanelError("Write the callout text.");
      return;
    }
    editor.chain().focus().insertContent(`<div class="blog-callout"><p>${escapeHtml(text)}</p></div>`).run();
    setCalloutText("");
    closePanel();
  }

  function applyCta() {
    if (!editor) return;
    const text = ctaText.trim();
    const label = ctaLabel.trim();
    const href = ctaUrl.trim();
    if (!text) {
      setPanelError("Write the call-to-action text.");
      return;
    }
    if (label && !/^https?:\/\//i.test(href)) {
      setPanelError("Add a button link starting with https://");
      return;
    }
    const button = label && href ? `<p><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>` : "";
    editor.chain().focus().insertContent(`<div class="blog-cta"><p>${escapeHtml(text)}</p>${button}</div>`).run();
    setCtaText("");
    setCtaLabel("");
    setCtaUrl("");
    closePanel();
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
          <ToolButton label="Link" showLabel active={panel === "link" || editor.isActive("link")} onClick={() => openPanel("link")}>
            <Link2 className="size-3.5" />
          </ToolButton>
          <ToolButton label="Image" showLabel active={panel === "image"} onClick={() => openPanel("image")}>
            <ImageIcon className="size-3.5" />
          </ToolButton>
          <ToolButton label="YouTube" showLabel active={panel === "youtube"} onClick={() => openPanel("youtube")}>
            <Video className="size-3.5" />
          </ToolButton>
          <ToolButton label="Table" showLabel active={panel === "table"} onClick={() => openPanel("table")}>
            <TableIcon className="size-3.5" />
          </ToolButton>
          <ToolButton label="Callout" showLabel active={panel === "callout"} onClick={() => openPanel("callout")}>
            <MessageSquareText className="size-3.5" />
          </ToolButton>
          <ToolButton label="CTA" showLabel active={panel === "cta"} onClick={() => openPanel("cta")}>
            <Megaphone className="size-3.5" />
          </ToolButton>
        </div>
        {panel ? (
          <InsertFields
            panel={panel}
            error={panelError}
            busy={busy}
            linkUrl={linkUrl}
            linkText={linkText}
            imageName={imageFile?.name ?? ""}
            imageAlt={imageAlt}
            youtubeUrl={youtubeUrl}
            tableRows={tableRows}
            tableCols={tableCols}
            calloutText={calloutText}
            ctaText={ctaText}
            ctaLabel={ctaLabel}
            ctaUrl={ctaUrl}
            onLinkUrl={setLinkUrl}
            onLinkText={setLinkText}
            onImageFile={setImageFile}
            onImageAlt={setImageAlt}
            onYoutubeUrl={setYoutubeUrl}
            onTableRows={setTableRows}
            onTableCols={setTableCols}
            onCalloutText={setCalloutText}
            onCtaText={setCtaText}
            onCtaLabel={setCtaLabel}
            onCtaUrl={setCtaUrl}
            onApplyLink={applyLink}
            onApplyImage={() => void applyImage()}
            onApplyYoutube={applyYoutube}
            onApplyTable={applyTable}
            onApplyCallout={applyCallout}
            onApplyCta={applyCta}
            onRemoveLink={() => {
              editor.chain().focus().unsetLink().run();
              closePanel();
            }}
            onClose={closePanel}
          />
        ) : null}
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

const fieldClass =
  "h-9 w-full rounded-lg border border-border-subtle bg-white px-2.5 text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";

function InsertFields(props: {
  panel: InsertPanel;
  error: string;
  busy: boolean;
  linkUrl: string;
  linkText: string;
  imageName: string;
  imageAlt: string;
  youtubeUrl: string;
  tableRows: string;
  tableCols: string;
  calloutText: string;
  ctaText: string;
  ctaLabel: string;
  ctaUrl: string;
  onLinkUrl: (value: string) => void;
  onLinkText: (value: string) => void;
  onImageFile: (file: File | null) => void;
  onImageAlt: (value: string) => void;
  onYoutubeUrl: (value: string) => void;
  onTableRows: (value: string) => void;
  onTableCols: (value: string) => void;
  onCalloutText: (value: string) => void;
  onCtaText: (value: string) => void;
  onCtaLabel: (value: string) => void;
  onCtaUrl: (value: string) => void;
  onApplyLink: () => void;
  onApplyImage: () => void;
  onApplyYoutube: () => void;
  onApplyTable: () => void;
  onApplyCallout: () => void;
  onApplyCta: () => void;
  onRemoveLink: () => void;
  onClose: () => void;
}) {
  const apply =
    props.panel === "link"
      ? props.onApplyLink
      : props.panel === "image"
        ? props.onApplyImage
        : props.panel === "youtube"
          ? props.onApplyYoutube
          : props.panel === "table"
            ? props.onApplyTable
            : props.panel === "callout"
              ? props.onApplyCallout
              : props.onApplyCta;

  return (
    <div className="grid gap-2 rounded-lg border border-border-subtle bg-white p-2.5">
      {props.panel === "link" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <PanelField label="Link address">
            <input className={fieldClass} value={props.linkUrl} placeholder="https://" onChange={(event) => props.onLinkUrl(event.target.value)} />
          </PanelField>
          <PanelField label="Link text" hint="Used when nothing is selected">
            <input className={fieldClass} value={props.linkText} placeholder="Text to show" onChange={(event) => props.onLinkText(event.target.value)} />
          </PanelField>
        </div>
      ) : null}
      {props.panel === "image" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <PanelField label="Image file">
            <input
              className={`${fieldClass} py-1.5 file:mr-2 file:rounded-md file:border-0 file:bg-primary-light file:px-2 file:text-xs file:font-semibold file:text-primary`}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => props.onImageFile(event.target.files?.[0] ?? null)}
            />
          </PanelField>
          <PanelField label="Image description" hint={props.imageName || "PNG, JPG, or WEBP"}>
            <input className={fieldClass} value={props.imageAlt} placeholder="What the image shows" onChange={(event) => props.onImageAlt(event.target.value)} />
          </PanelField>
        </div>
      ) : null}
      {props.panel === "youtube" ? (
        <PanelField label="YouTube link">
          <input className={fieldClass} value={props.youtubeUrl} placeholder="https://www.youtube.com/watch?v=…" onChange={(event) => props.onYoutubeUrl(event.target.value)} />
        </PanelField>
      ) : null}
      {props.panel === "table" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <PanelField label="Rows">
            <input className={fieldClass} inputMode="numeric" value={props.tableRows} onChange={(event) => props.onTableRows(event.target.value)} />
          </PanelField>
          <PanelField label="Columns">
            <input className={fieldClass} inputMode="numeric" value={props.tableCols} onChange={(event) => props.onTableCols(event.target.value)} />
          </PanelField>
        </div>
      ) : null}
      {props.panel === "callout" ? (
        <PanelField label="Callout text">
          <textarea className={`${fieldClass} h-16 resize-y py-2 leading-relaxed`} value={props.calloutText} placeholder="The note readers should see" onChange={(event) => props.onCalloutText(event.target.value)} />
        </PanelField>
      ) : null}
      {props.panel === "cta" ? (
        <div className="grid gap-2">
          <PanelField label="Message">
            <textarea className={`${fieldClass} h-16 resize-y py-2 leading-relaxed`} value={props.ctaText} placeholder="What should the reader do next?" onChange={(event) => props.onCtaText(event.target.value)} />
          </PanelField>
          <div className="grid gap-2 sm:grid-cols-2">
            <PanelField label="Button label">
              <input className={fieldClass} value={props.ctaLabel} placeholder="Apply on AsliJobs" onChange={(event) => props.onCtaLabel(event.target.value)} />
            </PanelField>
            <PanelField label="Button link">
              <input className={fieldClass} value={props.ctaUrl} placeholder="https://" onChange={(event) => props.onCtaUrl(event.target.value)} />
            </PanelField>
          </div>
        </div>
      ) : null}
      {props.error ? <p className="text-xs font-medium text-danger">{props.error}</p> : null}
      <div className="flex items-center gap-2">
        <button type="button" disabled={props.busy} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60" onClick={apply}>
          {props.busy ? "Uploading…" : "Insert"}
        </button>
        {props.panel === "link" ? (
          <button type="button" className="inline-flex h-8 items-center rounded-md border border-border-subtle bg-white px-3 text-xs font-semibold text-foreground hover:border-primary/30" onClick={props.onRemoveLink}>
            Remove link
          </button>
        ) : null}
        <button type="button" className="ml-auto inline-flex h-8 items-center px-2 text-xs font-semibold text-muted hover:text-foreground" onClick={props.onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function PanelField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold text-foreground">
      <span className="flex items-baseline justify-between gap-2">
        {label}
        {hint ? <span className="truncate font-medium text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
