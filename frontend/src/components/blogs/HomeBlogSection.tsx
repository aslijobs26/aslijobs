"use client";

import { BlogCardLink } from "@/components/blogs/BlogCardLink";
import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { fetchPublishedBlogs, type BlogCard } from "@/services/blogs.service";
import { useEffect, useState } from "react";

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
          {videoBlogs.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {videoBlogs.map((blog) => (
                <div key={blog.id} className="min-w-0">
                  <div className="aspect-video overflow-hidden rounded-xl bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${blog.youtubeVideoId}`}
                      title={blog.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="size-full border-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
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
