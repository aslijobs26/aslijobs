import type { PDFDocumentProxy } from "pdfjs-dist";

let workerConfigured = false;

export async function loadPdfDocument(blob: Blob): Promise<{
  pdf: PDFDocumentProxy;
  destroy: () => Promise<void>;
}> {
  const [{ getDocument, GlobalWorkerOptions }, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);

  if (!workerConfigured) {
    GlobalWorkerOptions.workerSrc = workerModule.default;
    workerConfigured = true;
  }

  const data = new Uint8Array(await blob.arrayBuffer());
  const loadingTask = getDocument({
    data,
    useSystemFonts: true,
    useWasm: false,
  });
  const pdf = await loadingTask.promise;
  return {
    pdf,
    destroy: async () => {
      await pdf.cleanup();
      await loadingTask.destroy();
    },
  };
}
