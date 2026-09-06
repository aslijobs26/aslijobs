import { FloatingBottomNav } from "@/components/layout/FloatingBottomNav";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import type { ReactNode } from "react";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {/* Clearance for FloatingBottomNav on mobile (footer is hidden below md). */}
      <div className="pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] md:pb-0">
        {children}
      </div>
      <Footer />
      <FloatingBottomNav />
    </>
  );
}
