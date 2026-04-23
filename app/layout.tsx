import type { Metadata } from "next";
import { Suspense } from "react";
import { Playfair_Display, Inter, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChromeGate from "@/components/layout/ChromeGate";
import CookieBanner from "@/components/layout/CookieBanner";
import AnalyticsTracker from "@/components/layout/AnalyticsTracker";
import ChatWidget from "@/components/chat/ChatWidget";
import { IntroContextProvider } from "@/lib/intro-context";
import { ModeProvider } from "@/lib/mode-context";

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal"],
  weight: ["400", "700", "900"],
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500"],
});

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal"],
  weight: ["400", "700"],
});

const SITE_URL = process.env.APP_URL ?? "https://arbiq.cz";
const SITE_DESCRIPTION =
  "Vyšetřujeme, proč váš digitální business nefunguje, a opravujeme to. Web, audit, nástroje, konzultace. Jeden detektiv, jeden případ, jeden výsledek.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ARBIQ — Detektivní agentura pro digitální business",
    template: "%s · ARBIQ",
  },
  description: SITE_DESCRIPTION,
  applicationName: "ARBIQ",
  authors: [{ name: "ARBIQ", url: SITE_URL }],
  keywords: ["digitální agentura", "weby na míru", "audit", "marketing", "Praha", "ARBIQ"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: SITE_URL,
    siteName: "ARBIQ",
    title: "ARBIQ — Detektivní agentura pro digitální business",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "ARBIQ — Detektivní agentura pro digitální business",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="cs"
      className={`${playfair.variable} ${inter.variable} ${ibmPlexMono.variable} ${newsreader.variable}`}
    >
      <body className="flex flex-col min-h-screen grain-overlay">
        <ModeProvider>
          <IntroContextProvider>
            <ChromeGate><Header /></ChromeGate>
            <main className="flex-1">{children}</main>
            <ChromeGate><Footer /></ChromeGate>
            <ChromeGate><CookieBanner /></ChromeGate>
            <Suspense fallback={null}><AnalyticsTracker /></Suspense>
            <ChromeGate><ChatWidget /></ChromeGate>
          </IntroContextProvider>
        </ModeProvider>
      </body>
    </html>
  );
}
