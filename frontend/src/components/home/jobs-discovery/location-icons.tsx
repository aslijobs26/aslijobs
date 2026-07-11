import type { JobLocationIconType } from "@/types/jobs-discovery";
import { cn } from "@/utils/cn";
import { Map, MapPin } from "lucide-react";
import type { ReactNode } from "react";

type LocationListIconProps = {
  iconType: JobLocationIconType;
  itemId: string;
  className?: string;
};

type StateIconThemeKey =
  | "green"
  | "blue"
  | "purple"
  | "orange"
  | "teal"
  | "pink";

type CityIconThemeKey =
  | "gold"
  | "employer"
  | "career"
  | "resume"
  | "guide"
  | "salary";

type LocationIconThemeKey = StateIconThemeKey | CityIconThemeKey;

const ICON_SHAPE = "fill-surface";
const ICON_LUCIDE = "text-surface";

type LocationIconTheme = {
  container: string;
  circle: string;
};

const LOCATION_ICON_THEMES: Record<LocationIconThemeKey, LocationIconTheme> = {
  green: {
    container: "bg-benefit-whatsapp-surface",
    circle: "fill-benefit-whatsapp-icon",
  },
  blue: {
    container: "bg-benefit-verified-surface",
    circle: "fill-benefit-verified-icon",
  },
  purple: {
    container: "bg-benefit-languages-surface",
    circle: "fill-benefit-languages-icon",
  },
  orange: {
    container: "bg-benefit-voice-surface",
    circle: "fill-benefit-voice-icon",
  },
  teal: {
    container: "bg-primary-light",
    circle: "fill-primary",
  },
  pink: {
    container: "bg-benefit-ai-matching-surface",
    circle: "fill-benefit-ai-matching-icon",
  },
  gold: {
    container: "bg-benefit-free-surface",
    circle: "fill-benefit-free-icon",
  },
  employer: {
    container: "bg-employer-cta",
    circle: "fill-employer-icon",
  },
  career: {
    container: "bg-location-chennai-icon-surface",
    circle: "fill-resource-career-icon",
  },
  resume: {
    container: "bg-resource-resume-icon-surface",
    circle: "fill-resource-resume-icon",
  },
  guide: {
    container: "bg-resource-guide-icon-surface",
    circle: "fill-resource-guide-icon",
  },
  salary: {
    container: "bg-resource-salary-icon-surface",
    circle: "fill-resource-salary-icon",
  },
};

const STATE_ITEM_THEME_KEY: Record<string, StateIconThemeKey> = {
  telangana: "green",
  "andhra-pradesh": "blue",
  karnataka: "purple",
  "tamil-nadu": "orange",
  maharashtra: "teal",
  kerala: "pink",
};

const CITY_ITEM_THEME_KEY: Record<string, CityIconThemeKey> = {
  hyderabad: "gold",
  bangalore: "employer",
  chennai: "career",
  vizag: "resume",
  vijayawada: "guide",
  coimbatore: "salary",
};

function getLocationIconTheme(
  itemId: string,
  iconType: JobLocationIconType,
): LocationIconTheme | null {
  if (iconType === "state") {
    const themeKey = STATE_ITEM_THEME_KEY[itemId];
    return themeKey ? LOCATION_ICON_THEMES[themeKey] : null;
  }

  const themeKey = CITY_ITEM_THEME_KEY[itemId];
  return themeKey ? LOCATION_ICON_THEMES[themeKey] : null;
}

export function getLocationIconContainerClass(
  itemId: string,
  iconType: JobLocationIconType,
): string {
  return getLocationIconTheme(itemId, iconType)?.container ?? "bg-hero-glow";
}

type LocationEmblemProps = {
  className?: string;
  theme: LocationIconTheme;
};

/**
 * Shared circular emblem shell: a soft-tinted disc with a landmark
 * silhouette drawn on top. Keeps every location logo visually consistent.
 */
function EmblemSvg({
  className,
  theme,
  children,
}: {
  className?: string;
  theme: LocationIconTheme;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="10" className={theme.circle} />
      {children}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* State emblems                                                              */
/* -------------------------------------------------------------------------- */

// Telangana — Kakatiya Kala Thoranam arch
export function TelanganaEmblemIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <rect x="5" y="11.25" width="10" height="2.75" rx="0.25" className={ICON_SHAPE} />
      <rect x="6.5" y="8.25" width="1.75" height="3" rx="0.25" className={ICON_SHAPE} />
      <rect x="9.125" y="7" width="1.75" height="4.25" rx="0.25" className={ICON_SHAPE} />
      <rect x="11.75" y="8.25" width="1.75" height="3" rx="0.25" className={ICON_SHAPE} />
      <circle cx="10" cy="6" r="1.1" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

// Andhra Pradesh — Amaravati stupa dome
function AndhraPradeshIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <rect x="5" y="13" width="10" height="1.6" rx="0.3" className={ICON_SHAPE} />
      <path d="M6 13 A4 4 0 0 1 14 13 Z" className={ICON_SHAPE} />
      <rect x="9.55" y="6" width="0.9" height="3.4" rx="0.25" className={ICON_SHAPE} />
      <circle cx="10" cy="5.6" r="0.85" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

// Karnataka — Vidhana Soudha (domed assembly building)
function KarnatakaIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <rect x="4.4" y="13" width="11.2" height="1.6" rx="0.3" className={ICON_SHAPE} />
      <rect x="5.8" y="9.6" width="8.4" height="3.6" className={ICON_SHAPE} />
      <path d="M7.6 9.6 A2.4 2.4 0 0 1 12.4 9.6 Z" className={ICON_SHAPE} />
      <rect x="9.6" y="6.6" width="0.8" height="1.3" rx="0.2" className={ICON_SHAPE} />
      <circle cx="10" cy="6.4" r="0.6" className={ICON_SHAPE} />
      <rect x="7" y="10.6" width="0.7" height="2.6" className={ICON_SHAPE} />
      <rect x="9.65" y="10.6" width="0.7" height="2.6" className={ICON_SHAPE} />
      <rect x="12.3" y="10.6" width="0.7" height="2.6" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

// Tamil Nadu — temple gopuram (stepped tower)
function TamilNaduIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <rect x="5.4" y="13" width="9.2" height="1.6" rx="0.25" className={ICON_SHAPE} />
      <rect x="6" y="11" width="8" height="2.1" className={ICON_SHAPE} />
      <rect x="6.7" y="9" width="6.6" height="2.1" className={ICON_SHAPE} />
      <rect x="7.4" y="7" width="5.2" height="2.1" className={ICON_SHAPE} />
      <path d="M8.3 7 L10 5 L11.7 7 Z" className={ICON_SHAPE} />
      <circle cx="10" cy="4.7" r="0.6" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

// Maharashtra — Gateway of India (central arch + towers)
function MaharashtraIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <rect x="4.6" y="13.4" width="10.8" height="1.3" rx="0.3" className={ICON_SHAPE} />
      <rect x="6.4" y="7.4" width="7.2" height="6" className={ICON_SHAPE} />
      <path
        d="M8.3 13.4 L8.3 10.6 A1.7 1.7 0 0 1 11.7 10.6 L11.7 13.4 Z"
        className={ICON_SHAPE}
      />
      <rect x="6.1" y="5.9" width="1.5" height="1.9" rx="0.2" className={ICON_SHAPE} />
      <rect x="12.4" y="5.9" width="1.5" height="1.9" rx="0.2" className={ICON_SHAPE} />
      <rect x="9.1" y="5.6" width="1.8" height="2.2" rx="0.2" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

// Kerala — kettuvallam houseboat on backwaters
function KeralaIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <path d="M5.3 11.8 Q10 14.6 14.7 11.8 L13.6 10.6 L6.4 10.6 Z" className={ICON_SHAPE} />
      <path d="M6.4 10.6 Q10 6.8 13.6 10.6 Z" className={ICON_SHAPE} />
      <rect x="9.6" y="11.4" width="0.8" height="1.6" rx="0.2" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

/* -------------------------------------------------------------------------- */
/* City emblems                                                               */
/* -------------------------------------------------------------------------- */

// Hyderabad — Charminar (minarets + central arch)
function HyderabadIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <rect x="5.6" y="12.4" width="8.8" height="2.2" rx="0.25" className={ICON_SHAPE} />
      <rect x="6.6" y="8" width="6.8" height="4.6" className={ICON_SHAPE} />
      <path
        d="M9 12.6 L9 10.6 A1 1 0 0 1 11 10.6 L11 12.6 Z"
        className={ICON_SHAPE}
      />
      <rect x="5.9" y="5.5" width="1" height="7.1" rx="0.3" className={ICON_SHAPE} />
      <rect x="13.1" y="5.5" width="1" height="7.1" rx="0.3" className={ICON_SHAPE} />
      <circle cx="6.4" cy="5.2" r="0.75" className={ICON_SHAPE} />
      <circle cx="13.6" cy="5.2" r="0.75" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

// Bangalore — Vidhana Soudha central dome
function BangaloreIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <rect x="4.6" y="12.9" width="10.8" height="1.7" rx="0.3" className={ICON_SHAPE} />
      <rect x="6" y="10" width="8" height="2.9" className={ICON_SHAPE} />
      <path d="M7.3 10 A2.7 2.7 0 0 1 12.7 10 Z" className={ICON_SHAPE} />
      <rect x="9.65" y="6.4" width="0.7" height="1.6" rx="0.2" className={ICON_SHAPE} />
      <circle cx="10" cy="6.2" r="0.6" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

// Chennai — Marina Beach lighthouse
function ChennaiIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <rect x="4.6" y="13.6" width="10.8" height="1" rx="0.3" className={ICON_SHAPE} />
      <path d="M8.3 13.6 L8.9 7.6 L11.1 7.6 L11.7 13.6 Z" className={ICON_SHAPE} />
      <rect x="8.55" y="10" width="2.9" height="1" className={ICON_SHAPE} />
      <rect x="8.8" y="6" width="2.4" height="1.7" rx="0.25" className={ICON_SHAPE} />
      <path d="M8.6 6 L10 4.5 L11.4 6 Z" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

// Vizag — port anchor
function VizagIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <circle cx="10" cy="5.4" r="1.1" className={ICON_SHAPE} />
      <circle cx="10" cy="5.4" r="0.45" className={ICON_SHAPE} />
      <rect x="9.5" y="6.2" width="1" height="6.4" rx="0.3" className={ICON_SHAPE} />
      <rect x="7.7" y="7.6" width="4.6" height="0.85" rx="0.42" className={ICON_SHAPE} />
      <path
        d="M6.4 10.8 Q6.6 13.4 10 13.9 Q13.4 13.4 13.6 10.8 L12.4 10.8 Q12 12.5 10 12.6 Q8 12.5 7.6 10.8 Z"
        className={ICON_SHAPE}
      />
    </EmblemSvg>
  );
}

// Vijayawada — Kanaka Durga temple on Indrakeeladri hill
function VijayawadaIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <path d="M3.8 14.2 L10 6.2 L16.2 14.2 Z" className={ICON_SHAPE} />
      <path d="M8.7 7 L10 4.4 L11.3 7 Z" className={ICON_SHAPE} />
      <circle cx="10" cy="4.1" r="0.55" className={ICON_SHAPE} />
      <path
        d="M9.3 14.2 L9.3 11.9 A0.7 0.7 0 0 1 10.7 11.9 L10.7 14.2 Z"
        className={ICON_SHAPE}
      />
    </EmblemSvg>
  );
}

// Coimbatore — Western Ghats peaks
function CoimbatoreIcon({ className, theme }: LocationEmblemProps) {
  return (
    <EmblemSvg className={className} theme={theme}>
      <circle cx="12.9" cy="6.6" r="1.1" className={ICON_SHAPE} />
      <path d="M3.6 14 L7 8.6 L9.6 12 L12.5 7.6 L16.4 14 Z" className={ICON_SHAPE} />
      <path d="M6 11 L7 9.4 L8 11 Z" className={ICON_SHAPE} />
      <path d="M11.4 9.6 L12.5 7.9 L13.6 9.6 Z" className={ICON_SHAPE} />
    </EmblemSvg>
  );
}

/* -------------------------------------------------------------------------- */
/* Lookups                                                                    */
/* -------------------------------------------------------------------------- */

type EmblemComponent = (props: LocationEmblemProps) => ReactNode;

const STATE_EMBLEMS: Record<string, EmblemComponent> = {
  telangana: TelanganaEmblemIcon,
  "andhra-pradesh": AndhraPradeshIcon,
  karnataka: KarnatakaIcon,
  "tamil-nadu": TamilNaduIcon,
  maharashtra: MaharashtraIcon,
  kerala: KeralaIcon,
};

const CITY_EMBLEMS: Record<string, EmblemComponent> = {
  hyderabad: HyderabadIcon,
  bangalore: BangaloreIcon,
  chennai: ChennaiIcon,
  vizag: VizagIcon,
  vijayawada: VijayawadaIcon,
  coimbatore: CoimbatoreIcon,
};

const FALLBACK_THEME = LOCATION_ICON_THEMES.teal;

export function LocationListIcon({
  iconType,
  itemId,
  className,
}: LocationListIconProps) {
  const theme = getLocationIconTheme(itemId, iconType) ?? FALLBACK_THEME;
  const iconClassName = cn("size-4", ICON_LUCIDE, className);

  if (iconType === "state") {
    const Emblem = STATE_EMBLEMS[itemId];
    if (Emblem) {
      return <Emblem className="size-5" theme={theme} />;
    }

    return <Map className={iconClassName} strokeWidth={2} aria-hidden="true" />;
  }

  const Emblem = CITY_EMBLEMS[itemId];
  if (Emblem) {
    return <Emblem className="size-5" theme={theme} />;
  }

  return (
    <MapPin className={iconClassName} strokeWidth={2} aria-hidden="true" />
  );
}
