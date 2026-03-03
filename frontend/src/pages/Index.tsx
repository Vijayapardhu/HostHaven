import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeatureCards from "@/components/home/FeatureCards";
import WeekendDeviationBanner from "@/components/home/WeekendDeviationBanner";
import DestinationsSection from "@/components/home/DestinationsSection";
import RecommendationsSection from "@/components/home/RecommendationsSection";
import React, { useMemo } from "react";
import TemplesPreview from "@/components/home/TemplesPreview";
import ServicesPreview from "@/components/home/ServicesPreview";
import BecomePartner from "@/components/home/BecomePartner";
import PromoBanner from "@/components/home/PromoBanner";
import { useHomepageConfig } from "@/hooks/useHomepageConfig";

const Index = () => {
  const { config, isSectionVisible } = useHomepageConfig();

  const sortedSections = useMemo(() => {
    // Define all available sections with a render function for lazy evaluation
    const availableSections = [
      { key: "banner", render: () => <WeekendDeviationBanner slides={config?.bannerSlides || []} /> },
      { key: "hero", render: () => <HeroSection /> },
      { key: "promoBanner", render: () => <PromoBanner config={config} /> },
      { key: "features", render: () => <FeatureCards items={config?.featureCards || []} /> },
      { key: "destinations", render: () => <DestinationsSection items={config?.destinations || []} /> },
      { key: "recommendations", render: () => <RecommendationsSection /> },
      { key: "temples", render: () => <TemplesPreview items={config?.temples || []} /> },
      { key: "services", render: () => <ServicesPreview items={config?.serviceCards || []} /> },
      { key: "becomePartner", render: () => <BecomePartner config={config?.partnerSection || { title: "", subtitle: "", ctaText: "", ctaLink: "" }} /> },
    ];

    return availableSections
      // 1. Filter out hidden sections
      .filter((section) => isSectionVisible(section.key))
      // 2. Sort by the order defined in the admin panel
      .sort((a, b) => {
        const orderA = config?.sections?.[a.key]?.order ?? 99;
        const orderB = config?.sections?.[b.key]?.order ?? 99;
        return orderA - orderB;
      });
  }, [config, isSectionVisible]);

  return (
    <Layout>
      {sortedSections.map(({ key, render }) => (
        <React.Fragment key={key}>
          {render()}
        </React.Fragment>
      ))}
    </Layout>
  );
};

export default Index;
