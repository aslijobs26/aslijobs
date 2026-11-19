"use client";

import { ChevronLeft } from "lucide-react";

const ADMIN_BLOGS_URL = "http://localhost:5173/operations/blogs";

function adminBlogsUrl() {
  const requested = new URLSearchParams(window.location.search).get("return");
  if (!requested) return ADMIN_BLOGS_URL;
  try {
    const url = new URL(requested);
    const localAdmin = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const allowed = url.pathname === "/operations/blogs" && (url.protocol === "https:" || (url.protocol === "http:" && localAdmin));
    if (allowed) return url.toString();
  } catch {
    return ADMIN_BLOGS_URL;
  }
  return ADMIN_BLOGS_URL;
}

export function PreviewBackButton() {
  return (
    <button
      type="button"
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#e4ebe8] bg-white px-3 text-xs font-semibold text-foreground shadow-sm hover:border-primary/30 hover:text-primary"
      onClick={() => {
        window.location.assign(adminBlogsUrl());
      }}
    >
      <ChevronLeft className="size-3.5" aria-hidden="true" />
      Back
    </button>
  );
}
