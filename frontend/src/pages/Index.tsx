import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeatureCards from "@/components/home/FeatureCards";
import WeekendDeviationBanner from "@/components/home/WeekendDeviationBanner";
import DestinationsSection from "@/components/home/DestinationsSection";
import RecommendationsSection from "@/components/home/RecommendationsSection";
import TemplesPreview from "@/components/home/TemplesPreview";
import ServicesPreview from "@/components/home/ServicesPreview";
import BecomePartner from "@/components/home/BecomePartner";

const Index = () => {
  return (
    <Layout>
      <WeekendDeviationBanner />
      <HeroSection />
      <FeatureCards />
      <DestinationsSection />
      <RecommendationsSection />
      <TemplesPreview />
      <ServicesPreview />
      <BecomePartner />
    </Layout>
  );
};

export default Index;
