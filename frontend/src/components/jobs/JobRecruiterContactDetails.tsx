import { cn } from "@/utils/cn";

type JobRecruiterContactDetailsProps = {
  name: string;
  whatsapp: string;
  email: string;
  whatsappLabel: string;
  className?: string;
};

export function JobRecruiterContactDetails({
  name,
  whatsapp,
  email,
  whatsappLabel,
  className,
}: JobRecruiterContactDetailsProps) {
  return (
    <div
      className={cn(
        "mt-3 space-y-1 text-[15px] leading-[1.7] break-words text-muted",
        className,
      )}
    >
      {name ? <p className="font-medium text-foreground">{name}</p> : null}
      {whatsapp ? <p>{whatsappLabel}</p> : null}
      {email ? <p>{email}</p> : null}
    </div>
  );
}
