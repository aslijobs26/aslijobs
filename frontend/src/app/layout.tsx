import {
  GoogleTagManagerNoscript,
  GoogleTagManagerScript,
} from "@/components/analytics/GoogleTagManager";
import { SiteLanguageSync } from "@/components/i18n/SiteLanguageSync";
import { QueryProvider } from "@/providers/query-provider";
import type { Metadata } from "next";
import {
  Inter,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
  Prosto_One,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-devanagari",
  preload: false,
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-telugu",
  preload: false,
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-tamil",
  preload: false,
});

const notoKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-kannada",
  preload: false,
});

const notoMalayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-malayalam",
  preload: false,
});

const prostoOne = Prosto_One({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-prosto",
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
    <html
      lang="en"
      className={`${inter.variable} ${prostoOne.variable} ${notoDevanagari.variable} ${notoTelugu.variable} ${notoTamil.variable} ${notoKannada.variable} ${notoMalayalam.variable}`}
    >
      <head>
        <GoogleTagManagerScript />
      </head>
      <body className="min-h-screen overflow-x-clip bg-white font-sans antialiased">
        <GoogleTagManagerNoscript />
        <SiteLanguageSync />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
