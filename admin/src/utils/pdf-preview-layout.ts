export function pdfPageFitScale(
  pageWidth: number,
  containerWidth: number,
  userScale: number,
): number {
  if (pageWidth <= 0 || containerWidth <= 0) {
    return userScale;
  }
  return (containerWidth / pageWidth) * userScale;
}

export function pdfPreviewObjectUrl(blobUrl: string): string {
  return blobUrl.split("#")[0] ?? blobUrl;
}
