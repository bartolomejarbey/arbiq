import type { Metadata } from "next";
import HeroDetective from "@/components/sections/HeroDetective";
import RentgenScenarios from "@/components/sections/RentgenScenarios";
import ServicesGrid from "@/components/sections/ServicesGrid";
import SolvedCases from "@/components/sections/SolvedCases";
import MoreCasesBanner from "@/components/sections/MoreCasesBanner";
import CTABanner from "@/components/sections/CTABanner";

// Homepage dostává vlastní keyword-forward title/description (kořenový default
// je brandový; tady cílíme na hlavní komerční dotazy: web, marketing, SEO, GEO, grafika).
export const metadata: Metadata = {
  title: { absolute: "ARBIQ — weby, marketing, SEO, GEO a grafika pro firmy" },
  description:
    "Digitální agentura ARBIQ staví weby na míru a řeší marketing, SEO, GEO (viditelnost v AI vyhledávačích), grafiku i automatizace pro malé a střední firmy. Vstupní audit Rentgen od 1 500 Kč.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ARBIQ — weby, marketing, SEO, GEO a grafika pro firmy",
    description:
      "Weby na míru, marketing, SEO, GEO viditelnost v AI vyhledávačích, grafika a automatizace pro malé a střední firmy. Audit Rentgen od 1 500 Kč.",
    url: "https://arbiq.cz",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <HeroDetective />
      <RentgenScenarios />
      <ServicesGrid />
      <SolvedCases />
      <MoreCasesBanner />
      <CTABanner />
    </>
  );
}
