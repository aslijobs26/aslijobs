import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { Download, ExternalLink, Minus, Plus } from "lucide-react";
import {
  loadPdfDocument,
} from "../../../utils/pdf-preview-renderer";
import { pdfPageFitScale } from "../../../utils/pdf-preview-layout";

interface DocumentPdfPreviewProps {
  blob: Blob;
  fileName: string;
  onOpenInNewTab: () => void;
  onDownload: () => void;
}

function PdfPageCanvas({
  pdf,
  pageNumber,
  fileName,
  containerWidth,
  userScale,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  fileName: string;
  containerWidth: number;
  userScale: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;
    let renderTask: RenderTask | undefined;
    const width = Math.max(containerWidth, 320);

    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) {
        return;
      }

      const unscaled = page.getViewport({ scale: 1 });
      const scale = pdfPageFitScale(unscaled.width, width, userScale);
      const viewport = page.getViewport({ scale });
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      renderTask = page.render({
        canvas,
        viewport,
        transform:
          outputScale === 1
            ? undefined
            : [outputScale, 0, 0, outputScale, 0, 0],
      });
      await renderTask.promise;
    };

    void renderPage().catch((error: unknown) => {
      if (
        cancelled ||
        (error instanceof Error && error.name === "RenderingCancelledException")
      ) {
        return;
      }
      console.error("[VerificationDocuments] PDF page render failed", {
        pageNumber,
        reason: error instanceof Error ? error.name : "unknown",
      });
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, containerWidth, userScale]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block max-w-full bg-white shadow-sm"
      aria-label={`${fileName} page ${pageNumber}`}
    />
  );
}

export function DocumentPdfPreview({
  blob,
  fileName,
  onOpenInNewTab,
  onDownload,
}: DocumentPdfPreviewProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [userScale, setUserScale] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(Math.max(0, node.clientWidth - 24));
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let destroyLoaded: (() => Promise<void>) | undefined;

    setStatus("loading");
    setPdf(null);
    setPageCount(0);

    const load = async () => {
      const loaded = await loadPdfDocument(blob);
      destroyLoaded = loaded.destroy;
      if (cancelled) {
        await loaded.destroy();
        return;
      }
      setPdf(loaded.pdf);
      setPageCount(loaded.pdf.numPages);
      setStatus("ready");
    };

    void load().catch((error: unknown) => {
      if (cancelled) {
        return;
      }
      console.error("[VerificationDocuments] PDF document load failed", {
        reason: error instanceof Error ? error.name : "unknown",
      });
      setStatus("error");
    });

    return () => {
      cancelled = true;
      void destroyLoaded?.();
    };
  }, [blob]);

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3 py-1.5">
        <p className="truncate text-[11px] text-muted">
          {status === "ready" && pageCount > 0
            ? `${fileName} · ${pageCount} page${pageCount === 1 ? "" : "s"}`
            : fileName}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setUserScale((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))}
            className="inline-flex size-7 items-center justify-center rounded-md border border-border-subtle text-muted hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Zoom out"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <span className="min-w-10 text-center text-[11px] font-semibold text-foreground">
            {Math.round(userScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setUserScale((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))))}
            className="inline-flex size-7 items-center justify-center rounded-md border border-border-subtle text-muted hover:bg-hero-bg/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Zoom in"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 overflow-auto bg-hero-bg/40 p-3"
      >
        {status === "loading" ? (
          <div className="flex h-full min-h-[320px] items-center justify-center text-xs text-muted">
            Loading preview…
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-sm font-medium text-danger" role="alert">
              Unable to preview this document.
            </p>
            <p className="text-xs text-muted">
              Please try Open in New Tab or Download.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onOpenInNewTab}
                className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-hero-bg/60"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Open in new tab
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-hero-bg/60"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Download
              </button>
            </div>
          </div>
        ) : null}

        {status === "ready" && pdf ? (
          <div className="flex flex-col gap-3">
            {pages.map((pageNumber) => (
              <PdfPageCanvas
                key={pageNumber}
                pdf={pdf}
                pageNumber={pageNumber}
                fileName={fileName}
                containerWidth={containerWidth}
                userScale={userScale}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
