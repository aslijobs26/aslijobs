import logoWhite from "@/assets/employer-register/logo-white.png";
import panelGradient from "@/assets/auth-visual/panel-gradient.png";
import seekerArt from "@/assets/auth-visual/job-seeker-illustration.png";
import employerPerson from "@/assets/auth-visual/employer-person.png";
import employerGlass from "@/assets/auth-visual/employer-glass.png";
import { ROUTES } from "@/constants/routes";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { EmployerRegisterTestimonial } from "./EmployerRegisterTestimonial";

const EMPLOYER_ROLE_LABELS = ["Plumber", "Driver", "Security Guard", "Maid"] as const;

const PANEL_SPARKLES: ReadonlyArray<{
  top: string;
  left: string;
  size: number;
  delay: number;
}> = [
  { top: "9%", left: "78%", size: 14, delay: 0 },
  { top: "21%", left: "90%", size: 9, delay: 1.2 },
  { top: "31%", left: "64%", size: 11, delay: 2.4 },
  { top: "40%", left: "8%", size: 10, delay: 0.6 },
  { top: "52%", left: "92%", size: 13, delay: 1.8 },
  { top: "63%", left: "4%", size: 8, delay: 3 },
  { top: "5%", left: "46%", size: 9, delay: 2.1 },
  { top: "74%", left: "88%", size: 10, delay: 0.9 },
  { top: "95%", left: "12%", size: 11, delay: 1.5 },
  { top: "96%", left: "84%", size: 8, delay: 2.7 },
];

export type AuthBrandVariant = "seeker" | "employer";

type EmployerRegisterPanelProps = {
  variant?: AuthBrandVariant;
};

export function EmployerRegisterPanel({
  variant = "employer",
}: EmployerRegisterPanelProps) {
  const headline =
    variant === "seeker"
      ? ["Your Next Job", "Starts Here"]
      : ["Your Next Hire", "Starts Here"];

  return (
    <aside className="employer-register-panel">
      <Image
        src={panelGradient}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 40vw"
        priority
        aria-hidden
      />

      <div className="employer-register-panel-content">
        <div className="auth-sparkles" aria-hidden="true">
          {PANEL_SPARKLES.map((sparkle) => (
            <span
              key={`${sparkle.top}-${sparkle.left}`}
              className="auth-sparkle"
              style={
                {
                  top: sparkle.top,
                  left: sparkle.left,
                  "--sparkle-size": `${sparkle.size}px`,
                  animationDelay: `-${sparkle.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

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
          <h2 className="auth-brand-headline">
            {headline[0]}
            <br />
            {headline[1]}
          </h2>

          <div className="employer-register-scale-group">
            {variant === "seeker" ? (
              <div className="auth-brand-art auth-brand-art--seeker" aria-hidden="true">
                <Image
                  src={seekerArt}
                  alt=""
                  className="auth-brand-cutout"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <div className="auth-brand-art auth-brand-art--employer" aria-hidden="true">
                <Image
                  src={employerPerson}
                  alt=""
                  className="auth-brand-cutout auth-brand-person"
                  priority
                />
                <Image
                  src={employerGlass}
                  alt=""
                  className="auth-brand-cutout auth-brand-glass"
                  priority
                />
                <span className="auth-role-chip auth-role-chip--plumber">
                  {EMPLOYER_ROLE_LABELS[0]}
                </span>
                <span className="auth-role-chip auth-role-chip--driver">
                  {EMPLOYER_ROLE_LABELS[1]}
                </span>
                <span className="auth-role-chip auth-role-chip--guard">
                  {EMPLOYER_ROLE_LABELS[2]}
                </span>
                <span className="auth-role-chip auth-role-chip--maid">
                  {EMPLOYER_ROLE_LABELS[3]}
                </span>
              </div>
            )}
          </div>

          <div className="employer-register-bottom">
            <EmployerRegisterTestimonial />
          </div>
        </div>
      </div>
    </aside>
  );
}
