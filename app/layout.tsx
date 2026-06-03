import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Playfair_Display, Inter, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChromeGate from "@/components/layout/ChromeGate";
import CookieBanner from "@/components/layout/CookieBanner";
import AnalyticsTracker from "@/components/layout/AnalyticsTracker";
import MetaPixel from "@/components/layout/MetaPixel";
import ChatWidget from "@/components/chat/ChatWidget";
import { IntroContextProvider } from "@/lib/intro-context";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema, localBusinessSchema } from "@/lib/seo/structured-data";

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
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

// SEO base URL — ZÁMĚRNĚ oddělené od APP_URL (to slouží OAuth/runtime a v devu
// je localhost). NEXT_PUBLIC_SITE_URL umožní override, default je produkční doména.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arbiq.cz";
const SITE_DESCRIPTION =
  "Vyšetřujeme, proč váš digitální business nefunguje, a opravujeme to. Web, audit, nástroje, konzultace. Jeden detektiv, jeden případ, jeden výsledek.";

const OG_IMAGE = {
  url: `${SITE_URL}/og-default.png`,
  width: 1200,
  height: 630,
  alt: "ARBIQ — Detektivní agentura pro digitální business",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#18120e" },
    { media: "(prefers-color-scheme: light)", color: "#FAF6EF" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ARBIQ — Detektivní agentura pro digitální business",
    template: "%s · ARBIQ",
  },
  description: SITE_DESCRIPTION,
  applicationName: "ARBIQ",
  authors: [{ name: "Bartoloměj Rota", url: `${SITE_URL}/tym` }],
  creator: "ARBIQ (Bartoloměj Rota)",
  publisher: "ARBIQ (Bartoloměj Rota)",
  keywords: [
    "digitální agentura Praha",
    "weby na míru",
    "Next.js vývoj",
    "AI viditelnost",
    "GEO optimalizace",
    "marketing automatizace",
    "audit webu",
    "Rentgen webu",
    "CRM na míru",
    "ARBIQ",
  ],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: SITE_URL,
    siteName: "ARBIQ",
    title: "ARBIQ — Detektivní agentura pro digitální business",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "ARBIQ — Detektivní agentura pro digitální business",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    // Vyplnit po přidání domény do Search Console / Bing Webmaster / Seznam Wmt:
    //   nastavit env vars GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION, SEZNAM_SITE_VERIFICATION
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.BING_SITE_VERIFICATION && {
        "msvalidate.01": process.env.BING_SITE_VERIFICATION,
      }),
      ...(process.env.SEZNAM_SITE_VERIFICATION && {
        "seznam-wmt": process.env.SEZNAM_SITE_VERIFICATION,
      }),
    },
  },
  category: "business",
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
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-caramel focus:text-espresso focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest">
          Přeskočit na obsah
        </a>
        <JsonLd data={[organizationSchema, websiteSchema, localBusinessSchema]} />
        <IntroContextProvider>
          <ChromeGate target="header"><Header /></ChromeGate>
          <main id="main-content" className="flex-1">{children}</main>
          <ChromeGate target="footer"><Footer /></ChromeGate>
          <ChromeGate target="cookies"><CookieBanner /></ChromeGate>
          <Suspense fallback={null}><AnalyticsTracker /></Suspense>
          <Suspense fallback={null}><MetaPixel /></Suspense>
          <ChromeGate target="chat"><ChatWidget /></ChromeGate>
        </IntroContextProvider>
      </body>
    </html>
  );
}
