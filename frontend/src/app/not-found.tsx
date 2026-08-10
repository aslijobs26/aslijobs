import { NotFoundPageContent } from "@/components/not-found/NotFoundPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | AsliJobs",
  description:
    "The page you’re looking for seems to have gone missing or moved to another location.",
};

export default function NotFound() {
  return <NotFoundPageContent />;
}
