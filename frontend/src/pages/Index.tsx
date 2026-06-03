import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import SearchBarSection from "@/components/home/SearchBarSection";
import FeatureCards from "@/components/home/FeatureCards";
import WeekendDeviationBanner from "@/components/home/WeekendDeviationBanner";
import DestinationsSection from "@/components/home/DestinationsSection";
import RecommendationsSection from "@/components/home/RecommendationsSection";
import React from "react";
import TemplesPreview from "@/components/home/TemplesPreview";
import ServicesPreview from "@/components/home/ServicesPreview";
import BecomePartner from "@/components/home/BecomePartner";
import PromoBanner from "@/components/home/PromoBanner";
import OffersSection from "@/components/home/OffersSection";
import { useHomepageConfig } from "@/hooks/useHomepageConfig";
import SEOHead from "@/components/SEOHead";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";

const Index = () => {
  const { config, isSectionVisible } = useHomepageConfig();
  const settings = usePublicPlatformSettings();
  const pageBackground = config?.pageBackground?.trim() || "hsl(var(--background))";

  const sortedSections = React.useMemo(() => {
    const availableSections = [
      { key: "banner", render: () => <WeekendDeviationBanner slides={config?.bannerSlides || []} /> },
      { key: "hero", render: () => <HeroSection /> },
      { key: "search", render: () => <SearchBarSection /> },
      { key: "offers", render: () => <OffersSection /> },
      { key: "promoBanner", render: () => <PromoBanner config={config} /> },
      { key: "features", render: () => <FeatureCards items={config?.featureCards || []} /> },
      { key: "destinations", render: () => <DestinationsSection items={config?.destinations || []} /> },
      { key: "recommendations", render: () => <RecommendationsSection /> },
      { key: "temples", render: () => <TemplesPreview items={config?.temples || []} /> },
      { key: "services", render: () => <ServicesPreview items={config?.serviceCards || []} /> },
      { key: "becomePartner", render: () => <BecomePartner config={config?.partnerSection || { title: "", subtitle: "", ctaText: "", ctaLink: "" }} /> },
    ];

    return availableSections
      .filter((section) => isSectionVisible(section.key))
      .sort((a, b) => {
        const orderA = config?.sections?.[a.key]?.order ?? 99;
        const orderB = config?.sections?.[b.key]?.order ?? 99;
        return orderA - orderB;
      });
  }, [config, isSectionVisible]);

  return (
    <>
      <SEOHead
        description="Discover and book the best hotels, homestays, and unique stays across Andhra Pradesh. Explore sacred temples, travel services, and heritage destinations with HostHaven."
        keywords="hotels Andhra Pradesh, homestays AP, book hotels Vijayawada, rental homes Nandyal, temples Andhra Pradesh, travel services AP, HostHaven"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "HostHaven",
          url: "https://hosthaven.in",
          logo: "https://hosthaven.in/logo.png",
          description: "Find and book hotels, homes, and unique stays in Andhra Pradesh",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Vijayawada",
            addressRegion: "Andhra Pradesh",
            addressCountry: "IN",
          },
          sameAs: [],
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: settings.contact.supportEmail,
            telephone: settings.contact.supportPhone,
            availableLanguage: ["English", "Telugu"],
          },
        }}
      />
      <Layout>
        <div style={{ background: pageBackground }}>
          {sortedSections.length === 0 ? (
            <HeroSection />
          ) : (
            sortedSections.map(({ key, render }) => (
              <React.Fragment key={key}>
                {render()}
              </React.Fragment>
            ))
          )}
        </div>
      </Layout>
    </>
  );
};

export default Index;
