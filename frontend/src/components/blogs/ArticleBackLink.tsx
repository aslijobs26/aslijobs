"use client";

import { ROUTES } from "@/constants/routes";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const className =
  "mb-4 inline-flex h-8 items-center gap-1 rounded-lg border border-[#e4ebe8] bg-white px-3 text-xs font-semibold text-foreground shadow-sm hover:border-primary/30 hover:text-primary";

function operationsBlogsUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const localAdmin = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const allowed = url.pathname === "/operations/blogs" && (url.protocol === "https:" || (url.protocol === "http:" && localAdmin));
    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

export function ArticleBackLink() {
  const destination = operationsBlogsUrl(useSearchParams().get("return"));
  if (destination) {
    return (
      <a href={destination} className={className}>
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        Back
      </a>
    );
  }
  return (
    <Link href={ROUTES.BLOGS} className={className}>
      <ChevronLeft className="size-3.5" aria-hidden="true" />
      Back
    </Link>
  );
}
