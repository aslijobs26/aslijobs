"use client";

import { Eye, Heart, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  recordBlogView,
  setBlogLike,
  type BlogEngagement,
} from "@/services/blogs.service";

export function BlogEngagementBar({
  slug,
  initialViews,
  initialLikes,
}: {
  slug: string;
  initialViews: number;
  initialLikes: number;
}) {
  const [engagement, setEngagement] = useState<BlogEngagement>({
    views: initialViews,
    likes: initialLikes,
    liked: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingLike, setSavingLike] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [likeError, setLikeError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const viewRequest = useRef<Promise<BlogEngagement> | null>(null);

  useEffect(() => {
    let active = true;
    const request = viewRequest.current ?? recordBlogView(slug);
    viewRequest.current = request;
    void request
      .then((result) => {
        if (active) setEngagement(result);
      })
      .catch((error: unknown) => {
        if (active) {
          if (viewRequest.current === request) viewRequest.current = null;
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load article engagement.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount, slug]);

  async function handleLike() {
    if (loading || savingLike) return;
    const liked = !engagement.liked;
    setSavingLike(true);
    setLikeError("");
    try {
      setEngagement(await setBlogLike(slug, liked));
    } catch (error) {
      setLikeError(
        error instanceof Error
          ? error.message
          : "Could not update your like. Please try again.",
      );
    } finally {
      setSavingLike(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-subtle bg-white px-3 text-xs text-muted">
        <Eye className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span>{engagement.views.toLocaleString("en-IN")} views</span>
      </span>
      <button
        type="button"
        onClick={() => void handleLike()}
        disabled={loading || savingLike}
        aria-pressed={engagement.liked}
        aria-label={
          engagement.liked
            ? `Unlike article (${engagement.likes} likes)`
            : `Like article (${engagement.likes} likes)`
        }
        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-70 ${
          engagement.liked
            ? "border-primary/25 bg-primary-light text-primary"
            : "border-border-subtle bg-white text-foreground hover:border-primary/35 hover:text-primary"
        }`}
      >
        {loading || savingLike ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Heart
            className="size-3.5"
            fill={engagement.liked ? "currentColor" : "none"}
            aria-hidden="true"
          />
        )}
        <span>{engagement.likes.toLocaleString("en-IN")}</span>
        <span>{engagement.liked ? "Liked" : "Like"}</span>
      </button>
      {loadError ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-danger" role="alert">
          Engagement unavailable.
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError("");
              viewRequest.current = null;
              setRetryCount((count) => count + 1);
            }}
            className="font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </span>
      ) : null}
      {likeError ? (
        <span className="text-[11px] text-danger" role="alert">
          {likeError}
        </span>
      ) : null}
    </div>
  );
}
