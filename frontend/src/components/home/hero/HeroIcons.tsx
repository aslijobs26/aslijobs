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
          "absolute inset-0 flex items-center justify-center bg-whatsapp text-white",
          className,
        )}
        aria-hidden
      >
        <i className="bi bi-whatsapp text-[0.8rem] leading-none text-white mobile:text-[0.9rem] md:text-[1rem] lg:text-[1.1rem] xl:text-[1.35rem] 2xl:text-[2rem]" />
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
