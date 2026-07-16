import logoWhite from "@/assets/employer-register/logo-white.png";
import panelBackground from "@/assets/employer-register/panel-background.png";
import { ROUTES } from "@/constants/routes";
import Image from "next/image";
import Link from "next/link";
import { EmployerRegisterIllustration } from "./EmployerRegisterIllustration";
import { EmployerRegisterTestimonial } from "./EmployerRegisterTestimonial";

export function EmployerRegisterPanel() {
  return (
    <aside className="employer-register-panel">
      <Image
        src={panelBackground}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 39vw"
        priority
        aria-hidden
      />

      <div className="employer-register-panel-content">
        <Link
          href={ROUTES.HOME}
          aria-label="AsliJobs home"
          className="employer-register-logo-link"
        >
          <Image
            src={logoWhite}
            alt="AsliJobs"
            width={240}
            height={90}
            className="employer-register-logo"
            priority
          />
        </Link>

        <div className="employer-register-panel-body">
          <div className="employer-register-scale-group">
            <EmployerRegisterIllustration />
          </div>

          <div className="employer-register-bottom">
            <EmployerRegisterTestimonial />
          </div>
        </div>
      </div>
    </aside>
  );
}
