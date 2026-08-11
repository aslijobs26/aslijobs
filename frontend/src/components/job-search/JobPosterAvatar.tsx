"use client";

import { cn } from "@/utils/cn";
import { getCompanyInitials } from "@/utils/job-search-format";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { useState } from "react";

type JobPosterAvatarProps = {
  companyName: string;
  imageUrl?: string | null;
  className?: string;
};

export function JobPosterAvatar({
  companyName,
  imageUrl,
  className,
}: JobPosterAvatarProps) {
  const resolvedUrl = resolveMediaUrl(imageUrl);
  const [failedUrl, setFailedUrl] = useState("");
  const showImage = Boolean(resolvedUrl) && failedUrl !== resolvedUrl;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-primary-light font-semibold tracking-wide text-primary",
        className,
      )}
      aria-hidden="true"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- employer upload URL
        <img
          key={resolvedUrl}
          src={resolvedUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedUrl(resolvedUrl)}
        />
      ) : (
        getCompanyInitials(companyName)
      )}
    </div>
  );
}
