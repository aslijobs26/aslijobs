import logoWhite from "@/assets/employer-register/logo-white.png";
import panelBackground from "@/assets/employer-register/panel-background.png";
import { ROUTES } from "@/constants/routes";
import Image from "next/image";
import Link from "next/link";
import { EmployerRegisterIllustration } from "./EmployerRegisterIllustration";
import { EmployerRegisterTestimonial } from "./EmployerRegisterTestimonial";

export function EmployerRegisterPanel() {
  return (
    <aside className="relative flex min-h-[24rem] flex-col overflow-hidden text-surface sm:min-h-[28rem] lg:h-dvh lg:min-h-0 lg:w-[39%] lg:shrink-0">
      <Image
        src={panelBackground}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 39vw"
        priority
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-1 flex-col px-8 pb-6 pt-10 sm:px-10 sm:pb-7 sm:pt-11 lg:px-12 lg:pb-8 lg:pt-12">
        <Link
          href={ROUTES.HOME}
          aria-label="AsliJobs home"
          className="inline-flex w-fit shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/40"
        >
          <Image
            src={logoWhite}
            alt="AsliJobs"
            width={240}
            height={90}
            className="h-14 w-auto sm:h-16 lg:h-[4.25rem]"
            priority
          />
        </Link>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-6 lg:py-8">
          <EmployerRegisterIllustration />
        </div>

        <div className="shrink-0">
          <EmployerRegisterTestimonial />
        </div>
      </div>
    </aside>
  );
}
