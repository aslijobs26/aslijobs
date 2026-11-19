import { env } from "../constants/env";
import { openSiteBlogPreview } from "../services/blogs.service";
import { getOperationsApiErrorMessage } from "../utils/operations-api-errors";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export function OperationsBlogPreviewPage() {
  const { blogId = "" } = useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!env.publicSiteUrl) {
      setError("The public website address is not configured.");
      return;
    }
    void openSiteBlogPreview(blogId).catch((err) => {
      setError(getOperationsApiErrorMessage(err, "Preview unavailable."));
    });
  }, [blogId]);

  return (
    <main className="grid min-h-dvh place-items-center bg-white px-6 text-sm text-neutral-600">
      {error ? <p>{error}</p> : <p>Opening the website preview…</p>}
    </main>
  );
}
