import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { WHATSAPP_CONTACT_URL } from "@/constants/cta";

export function FloatingWhatsAppButton() {
  return (
    <a
      href={WHATSAPP_CONTACT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with AsliJobs on WhatsApp"
      title="Chat with AsliJobs on WhatsApp"
      className="fixed z-50 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-white animate-whatsapp-fab transition-transform duration-200 ease-out hover:scale-105 hover:bg-whatsapp-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/50 focus-visible:ring-offset-2 active:scale-95 right-4 bottom-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] md:right-6 md:bottom-6 md:size-16"
    >
      <WhatsAppIcon className="text-[1.75rem] leading-none text-white md:text-[2rem]" />
    </a>
  );
}
