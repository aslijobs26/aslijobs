import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import type { WorkflowIconKey } from "@/types/trust-resources";
import { MessageCircle, Search, Send } from "lucide-react";
import type { ReactNode } from "react";

const iconClassName = "size-5";

const iconMap: Record<WorkflowIconKey, ReactNode> = {
  whatsapp: <WhatsAppIcon className="text-xl" />,
  language: (
    <MessageCircle
      className={iconClassName}
      strokeWidth={2}
      aria-hidden="true"
    />
  ),
  search: (
    <Search className={iconClassName} strokeWidth={2} aria-hidden="true" />
  ),
  apply: <Send className={iconClassName} strokeWidth={2} aria-hidden="true" />,
};

export function WorkflowIcon({ icon }: { icon: WorkflowIconKey }) {
  return iconMap[icon];
}
