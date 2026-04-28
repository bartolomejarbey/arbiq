import HeroDetective from "@/components/sections/HeroDetective";
import RentgenScenarios from "@/components/sections/RentgenScenarios";
import ServicesGrid from "@/components/sections/ServicesGrid";
import SolvedCases from "@/components/sections/SolvedCases";
import MoreCasesBanner from "@/components/sections/MoreCasesBanner";
import CTABanner from "@/components/sections/CTABanner";

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
