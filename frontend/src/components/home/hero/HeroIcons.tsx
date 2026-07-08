import { cn } from "@/utils/cn";

type WhatsAppIconProps = {
  className?: string;
  fill?: boolean;
};

export function WhatsAppIcon({ className, fill = false }: WhatsAppIconProps) {
  if (fill) {
    return (
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-whatsapp",
          className,
        )}
        aria-hidden
      >
        <i className="bi bi-whatsapp text-[1.5rem] leading-none sm:text-[1.75rem]" />
      </span>
    );
  }

  return (
    <i
      className={cn("bi bi-whatsapp leading-none text-whatsapp", className)}
      aria-hidden
    />
  );
}
