import {
  GoogleTagManagerNoscript,
  GoogleTagManagerScript,
} from "@/components/analytics/GoogleTagManager";
import { SiteLanguageSync } from "@/components/i18n/SiteLanguageSync";
import { QueryProvider } from "@/providers/query-provider";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin-wght.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

const notoDevanagari = localFont({
  src: "./fonts/noto-sans-devanagari-wght.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-devanagari",
  preload: false,
});

const notoTelugu = localFont({
  src: "./fonts/noto-sans-telugu-wght.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-telugu",
  preload: false,
});

const notoTamil = localFont({
  src: "./fonts/noto-sans-tamil-wght.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-tamil",
  preload: false,
});

const notoKannada = localFont({
  src: "./fonts/noto-sans-kannada-wght.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-kannada",
  preload: false,
});

const notoMalayalam = localFont({
  src: "./fonts/noto-sans-malayalam-wght.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-malayalam",
  preload: false,
});

const prostoOne = localFont({
  src: "./fonts/prosto-one-latin-400.woff2",
  weight: "400",
  display: "swap",
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
