import { cn } from "../../utils/cn";

interface OperationsAvatarProps {
  initials: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
};

export function OperationsAvatar({
  initials,
  size = "sm",
  className,
}: OperationsAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary",
        SIZE_CLASSES[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
