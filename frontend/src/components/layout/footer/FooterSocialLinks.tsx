import type { SocialPlatform } from "@/constants/social";
import { SOCIAL_LINKS } from "@/constants/social";
import { cn } from "@/utils/cn";
import { SocialIcon } from "./footer-social-icons";

const socialButtonStyles: Record<SocialPlatform, string> = {
  x: "bg-social-x text-surface hover:brightness-110",
  facebook: "bg-social-facebook text-surface hover:brightness-110",
  instagram: "bg-social-instagram text-surface hover:brightness-110",
  youtube: "bg-social-youtube text-surface hover:brightness-110",
  linkedin: "bg-social-linkedin text-surface hover:brightness-110",
};

export function FooterSocialLinks() {
  return (
    <div className="flex flex-nowrap items-center gap-2">
      {SOCIAL_LINKS.map((link) => {
        return (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              socialButtonStyles[link.id],
            )}
          >
            <SocialIcon platform={link.id} className="size-3.5" />
          </a>
        );
      })}
    </div>
  );
}
