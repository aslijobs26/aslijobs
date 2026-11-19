"use client";

import { BlogCardLink } from "@/components/blogs/BlogCardLink";
import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { fetchPublishedBlogs, type BlogCard } from "@/services/blogs.service";
import { Play, X } from "lucide-react";
import { useEffect, useState } from "react";

function HomeVideoStrip({ blogs, title }: { blogs: BlogCard[]; title: string }) {
  const [active, setActive] = useState<BlogCard | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <h3
        id="home-blog-videos"
        className="discovery-section-title mt-10 min-w-0 text-pretty break-words text-lg font-bold leading-snug text-foreground"
      >
        {title}
      </h3>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {blogs.map((blog) => (
          <button
            key={blog.id}
            type="button"
            onClick={() => setActive(blog)}
            className="group relative aspect-video w-[78%] shrink-0 overflow-hidden rounded-2xl bg-[#1c2430] sm:w-[46%] lg:w-[calc((100%-3rem)/3.2)]"
          >
            <img
              src={`https://i.ytimg.com/vi/${blog.youtubeVideoId}/hqdefault.jpg`}
              alt=""
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />
            <span className="absolute left-1/2 top-1/2 inline-flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-md">
              <Play className="ml-0.5 size-5 fill-white" aria-hidden="true" />
            </span>
            <span className="sr-only">Play {blog.title}</span>
          </button>
        ))}
      </div>
      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setActive(null)}
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
                onClick={() => setActive(null)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${active.youtubeVideoId}?autoplay=1`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPublishedBlogs({ limit: 4 })
      .then((data) => {
        if (active) setBlogs(data.items);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const articles = blogs ?? [];
  const videoBlogs = articles.filter((blog) => blog.youtubeVideoId);

  if (failed || (blogs && articles.length === 0)) {
    return null;
  }

  return (
    <section aria-labelledby="home-blogs">
      <DiscoverySectionHeader
        title={t("home.trust.blogsTitle")}
        titleId="home-blogs"
        actionLabel={t("home.trust.blogsAction")}
        actionHref={ROUTES.BLOGS}
      />
      {blogs ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((blog) => (
              <BlogCardLink key={blog.id} blog={blog} />
            ))}
          </div>
          {videoBlogs.length > 0 ? <HomeVideoStrip blogs={videoBlogs} title={t("home.trust.videosTitle")} /> : null}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[16/10] rounded-2xl bg-primary-light" />
              <div className="mt-3 h-3 w-24 rounded bg-primary-light" />
              <div className="mt-2 h-4 w-full rounded bg-primary-light" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
