import amazonLogo from "@/assets/branding/amazon.png";
import swiggyLogo from "@/assets/branding/Swiggy_(2).png";
import type { PopularJob } from "@/types/jobs-discovery";
import { ROUTES } from "./routes";

function jobHref(id: string) {
  return `${ROUTES.FIND_JOBS}?city=hyderabad&job=${id}`;
}

export const POPULAR_JOBS_VIEW_ALL_HREF = `${ROUTES.FIND_JOBS}?city=hyderabad`;

export const POPULAR_JOBS_HYDERABAD: PopularJob[] = [
  {
    id: "delivery-boy-swiggy",
    title: "Delivery Boy",
    companyName: "Swiggy",
    companyInitials: "S",
    companyLogo: swiggyLogo,
    location: "Hyderabad",
    salaryMin: "₹15,000",
    salaryMax: "₹22,000",
    salaryPeriod: "month",
    tags: ["Full Time", "Fresher"],
    postedAt: "2 days ago",
    href: jobHref("delivery-boy-swiggy"),
  },
  {
    id: "driver-uber",
    title: "Driver",
    companyName: "Uber India",
    companyInitials: "U",
    location: "Hyderabad",
    salaryMin: "₹18,000",
    salaryMax: "₹25,000",
    salaryPeriod: "month",
    tags: ["Full Time", "Male Only"],
    postedAt: "1 day ago",
    href: jobHref("driver-uber"),
  },
  {
    id: "warehouse-associate-amazon",
    title: "Warehouse Associate",
    companyName: "Amazon",
    companyInitials: "A",
    companyLogo: amazonLogo,
    location: "Hyderabad",
    salaryMin: "₹14,000",
    salaryMax: "₹20,000",
    salaryPeriod: "month",
    tags: ["Full Time", "Fresher"],
    postedAt: "3 days ago",
    href: jobHref("warehouse-associate-amazon"),
  },
  {
    id: "telecaller-hdfc",
    title: "Telecaller",
    companyName: "HDFC Bank",
    companyInitials: "H",
    location: "Hyderabad",
    salaryMin: "₹12,000",
    salaryMax: "₹18,000",
    salaryPeriod: "month",
    tags: ["Full Time", "Fresher"],
    postedAt: "4 days ago",
    href: jobHref("telecaller-hdfc"),
  },
  {
    id: "sales-executive-vivo",
    title: "Sales Executive",
    companyName: "Vivo India",
    companyInitials: "V",
    location: "Hyderabad",
    salaryMin: "₹16,000",
    salaryMax: "₹25,000",
    salaryPeriod: "month",
    tags: ["Full Time", "Experience Only"],
    postedAt: "2 days ago",
    href: jobHref("sales-executive-vivo"),
  },
];
