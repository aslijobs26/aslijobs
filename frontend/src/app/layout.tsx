import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import { QueryProvider } from "@/providers/query-provider";
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "AsliJobs",
  description: "AsliJobs platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={quicksand.variable}>
      <body className="min-h-screen bg-white font-sans antialiased">
        <QueryProvider>
          <Navbar />
          {children}
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
