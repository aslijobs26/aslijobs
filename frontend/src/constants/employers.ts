import amazonLogo from "@/assets/branding/amazon.png";
import delhiveryLogo from "@/assets/branding/delhivery-seeklogo.png";
import dhlLogo from "@/assets/branding/dhl-seeklogo.png";
import flipkartLogo from "@/assets/branding/Flipkart_logo_PNG1.png";
import propenuLogo from "@/assets/branding/propenu.png";
import relianceLogo from "@/assets/branding/RELIANCE.NS_BIG.png";
import swiggyLogo from "@/assets/branding/Swiggy_(2).png";
import tataLogo from "@/assets/branding/Tata_logo.svg";
import teamWorksLogo from "@/assets/branding/TeamWorks.png";
import zomatoLogo from "@/assets/branding/Zomato_logo_PNG1.png";
import type { Employer } from "@/types/discovery";
import { ROUTES } from "./routes";

function employerHref(slug: string) {
  return `${ROUTES.FIND_JOBS}?employer=${slug}`;
}

export const TOP_EMPLOYERS: Employer[] = [
  {
    id: "amazon",
    name: "Amazon",
    initials: "A",
    href: employerHref("amazon"),
    logo: amazonLogo,
  },
  {
    id: "flipkart",
    name: "Flipkart",
    initials: "F",
    href: employerHref("flipkart"),
    logo: flipkartLogo,
  },
  {
    id: "zomato",
    name: "Zomato",
    initials: "Z",
    href: employerHref("zomato"),
    logo: zomatoLogo,
  },
  {
    id: "swiggy",
    name: "Swiggy",
    initials: "S",
    href: employerHref("swiggy"),
    logo: swiggyLogo,
  },
  {
    id: "tata-group",
    name: "Tata Group",
    initials: "T",
    href: employerHref("tata-group"),
    logo: tataLogo,
  },
  {
    id: "reliance-retail",
    name: "Reliance Retail",
    initials: "R",
    href: employerHref("reliance-retail"),
    logo: relianceLogo,
  },
  {
    id: "dhl-express",
    name: "DHL Express",
    initials: "DHL",
    href: employerHref("dhl-express"),
    logo: dhlLogo,
  },
  {
    id: "delhivery",
    name: "Delhivery",
    initials: "D",
    href: employerHref("delhivery"),
    logo: delhiveryLogo,
  },
  {
    id: "teamworks",
    name: "TeamWorks",
    initials: "TW",
    href: employerHref("teamworks"),
    logo: teamWorksLogo,
  },
  {
    id: "propenu",
    name: "Propenu",
    initials: "P",
    href: employerHref("propenu"),
    logo: propenuLogo,
  },
];
