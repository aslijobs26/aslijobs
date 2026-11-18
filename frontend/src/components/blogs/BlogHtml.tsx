"use client";

import styles from "@/components/blogs/blog-body.module.css";
import { useEffect, useRef } from "react";

const MIN_IMAGE_EDGE = 64;

export function BlogHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const images = [...root.querySelectorAll("img")];
    for (const image of images) {
      const collapse = () => {
        if (image.naturalWidth >= MIN_IMAGE_EDGE && image.naturalHeight >= MIN_IMAGE_EDGE) return;
        const figure = image.closest("figure");
        const target = figure && figure.querySelectorAll("img").length === 1 ? figure : image;
        target.setAttribute("hidden", "");
      };
      if (image.complete) collapse();
      else image.addEventListener("load", collapse, { once: true });
    }
  }, [html]);

  return (
    <div
      ref={ref}
      className={`${styles["blog-body"]} mt-7`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
