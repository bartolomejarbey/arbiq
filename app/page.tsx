import HeroDetective from "@/components/sections/HeroDetective";
import RentgenScenarios from "@/components/sections/RentgenScenarios";
import ServicesGrid from "@/components/sections/ServicesGrid";
import SolvedCases from "@/components/sections/SolvedCases";
import CTABanner from "@/components/sections/CTABanner";

export default function Home() {
  return (
    <>
      <HeroDetective />
      <RentgenScenarios />
      <ServicesGrid />
      <SolvedCases />
      <CTABanner />
    </>
  );
}
