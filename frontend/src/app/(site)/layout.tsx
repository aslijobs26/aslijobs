import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import type { ReactNode } from "react";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
