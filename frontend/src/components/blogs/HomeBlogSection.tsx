"use client";

import { BlogCardLink } from "@/components/blogs/BlogCardLink";
import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { fetchPublishedBlogs, type BlogCard } from "@/services/blogs.service";
import { ArrowRight, Clapperboard, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchPublishedVideos, type PublicVideo } from "@/services/videos.service";

function uploadedVideoMimeType(video: PublicVideo): string | undefined {
  const mimeType = video.uploadedVideo?.mimeType?.toLowerCase();
  if (mimeType === "video/mp4" || mimeType === "video/webm") return mimeType;
  if (/\.mp4(?:[?#]|$)/i.test(video.uploadedVideo?.url || "")) return "video/mp4";
  if (/\.webm(?:[?#]|$)/i.test(video.uploadedVideo?.url || "")) return "video/webm";
  return undefined;
}

function HomeVideoStrip({ videos, title, tagline }: { videos: PublicVideo[]; title: string; tagline: string }) {
  const [active, setActive] = useState<PublicVideo | null>(null);
  const [playbackError, setPlaybackError] = useState(false);
  const [failedPreviewIds, setFailedPreviewIds] = useState<Set<string>>(() => new Set());
  const playerRef = useRef<HTMLVideoElement | null>(null);

  function closePlayer() {
    playerRef.current?.pause();
    playerRef.current = null;
    setActive(null);
    setPlaybackError(false);
  }

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        playerRef.current?.pause();
        playerRef.current = null;
        setActive(null);
        setPlaybackError(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className="mt-10">
        <h3
          id="home-blog-videos"
          className="discovery-section-title min-w-0 text-pretty break-words text-lg font-bold leading-snug text-foreground"
        >
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{tagline}</p>
      </div>
      <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => {
              setPlaybackError(false);
              setActive(video);
            }}
            aria-label={`Play ${video.title}`}
            className="group w-[78%] min-w-0 shrink-0 snap-start text-left sm:w-[46%] lg:w-[calc((100%-3rem)/4)]"
          >
            <span className="relative block aspect-video overflow-hidden rounded-2xl bg-[#1c2430]">
              {video.source === "uploaded" &&
              video.thumbnailUrl &&
              video.thumbnailUrl !== video.uploadedVideo?.url ? (
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : video.source === "youtube" && (video.thumbnailUrl || video.youtubeVideoId) ? (
                <img
                  src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : video.source === "uploaded" &&
                video.uploadedVideo?.url &&
                !failedPreviewIds.has(video.id) ? (
                <video
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                  onError={() => {
                    setFailedPreviewIds((current) => new Set(current).add(video.id));
                  }}
                  onLoadedMetadata={(event) => {
                    const element = event.currentTarget;
                    if (Number.isFinite(element.duration) && element.duration > 0) {
                      element.currentTime = Math.min(0.1, element.duration / 2);
                    }
                  }}
                  className="size-full object-cover"
                >
                  <source src={video.uploadedVideo.url} type={uploadedVideoMimeType(video)} />
                </video>
              ) : (
                <span className="flex size-full items-center justify-center text-white/60">
                  <Clapperboard className="size-8" aria-hidden="true" />
                </span>
              )}
              <span className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />
              <span className="absolute left-1/2 top-1/2 inline-flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-md">
                <Play className="ml-0.5 size-5 fill-white" aria-hidden="true" />
              </span>
            </span>
            <span className="mt-2 block line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {video.title}
            </span>
          </button>
        ))}
      </div>
      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closePlayer}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-black shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <p className="min-w-0 truncate text-sm font-semibold text-white">{active.title}</p>
              <button
                type="button"
                aria-label="Close video"
                onClick={closePlayer}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="aspect-video">
              {active.source === "youtube" ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${active.youtubeVideoId}?autoplay=1&controls=1&playsinline=1`}
                  title={active.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="size-full border-0"
                />
              ) : (
                active.uploadedVideo?.url && !playbackError ? (
                  <video
                    key={active.id}
                    ref={playerRef}
                    controls
                    autoPlay
                    playsInline
                    className="size-full"
                    onError={(event) => {
                      event.currentTarget.pause();
                      setPlaybackError(true);
                    }}
                  >
                    <source
                      src={active.uploadedVideo.url}
                      type={uploadedVideoMimeType(active)}
                    />
                  </video>
                ) : (
                  <p role="alert" className="flex size-full items-center justify-center px-6 text-center text-sm text-white/80">
                    This video is currently unavailable.
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function HomeBlogSection() {
  const t = useTranslate();
  const [blogs, setBlogs] = useState<BlogCard[] | null>(null);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [blogFetchFailed, setBlogFetchFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPublishedBlogs({ limit: 4 })
      .then((data) => {
        if (active) setBlogs(data.items);
      })
      .catch(() => {
        if (active) setBlogFetchFailed(true);
      });
    fetchPublishedVideos(12)
      .then((data) => {
        if (active) setVideos(data);
      })
      .catch(() => {
        if (active) setVideos([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const articles = blogs ?? [];
  const showBlogSkeleton = blogs === null && !blogFetchFailed;
  const showBlogSection = articles.length > 0;
  const showVideoSection = videos.length > 0;

  if (!showBlogSection && !showBlogSkeleton && !showVideoSection) {
    return null;
  }

  return (
    <section aria-label="Latest blogs and videos">
      {showBlogSection ? (
        <div aria-labelledby="home-blogs">
          <DiscoverySectionHeader
            title={t("home.trust.blogsTitle")}
            titleId="home-blogs"
            actionLabel={t("home.trust.blogsAction")}
            actionHref={ROUTES.BLOGS}
            actionTrailing={<ArrowRight className="size-4 shrink-0" aria-hidden="true" />}
            className="flex-row items-center justify-between gap-3 md:items-baseline md:gap-4"
            titleClassName="w-auto flex-1 md:w-full md:flex-initial"
            actionClassName="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-right"
          />
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {articles.map((blog) => (
              <div
                key={blog.id}
                className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-3rem)/4)]"
              >
                <BlogCardLink blog={blog} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {showBlogSkeleton ? (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="w-[78%] shrink-0 snap-start animate-pulse sm:w-[46%] lg:w-[calc((100%-3rem)/4)]"
            >
              <div className="aspect-[16/9] rounded-2xl bg-primary-light" />
              <div className="mt-3 h-3 w-24 rounded bg-primary-light" />
              <div className="mt-2 h-4 w-full rounded bg-primary-light" />
            </div>
          ))}
        </div>
      ) : null}
      {showVideoSection ? (
        <HomeVideoStrip
          videos={videos}
          title={t("home.trust.videosTitle")}
          tagline={t("home.trust.videosTagline")}
        />
      ) : null}
    </section>
  );
}
