import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { resolveMediaUrl } from "../../utils/resolve-media-url";

function employerInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const SIZE_CLASSES = {
  sm: {
    box: "size-7 text-[9px]",
    ring: "ring-1 ring-border-subtle",
  },
  md: {
    box: "size-8 text-[10px]",
    ring: "ring-1 ring-border-subtle/80",
  },
  lg: {
    box: "size-12 text-sm",
    ring: "ring-1 ring-border-subtle",
  },
} as const;

interface EmployerLogoProps {
  name: string;
  logoUrl: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function EmployerLogo({
  name,
  logoUrl,
  size = "sm",
  className,
}: EmployerLogoProps) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = resolveMediaUrl(logoUrl);
  const sizeClass = SIZE_CLASSES[size];

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  if (!resolvedUrl || failed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary",
          sizeClass.box,
          sizeClass.ring,
          className,
        )}
        aria-hidden="true"
      >
        {employerInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt=""
      className={cn(
        "shrink-0 rounded-full object-cover",
        sizeClass.box,
        sizeClass.ring,
        className,
      )}
      onError={() => setFailed(true)}
    />
  );
}
