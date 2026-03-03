import { useState, useEffect } from 'react';

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  tags: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  isActive: boolean;
}

export interface DestinationItem {
  id: string;
  name: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

export interface FeatureCardItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  link?: string;
  isActive: boolean;
}

export interface ServiceCardItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  link: string;
  isActive: boolean;
}

export interface TempleItem {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

export interface SectionConfig {
  isVisible: boolean;
  order: number;
}

export interface HomepageConfig {
  sections: Record<string, SectionConfig>;
  bannerSlides: BannerSlide[];
  destinations: DestinationItem[];
  featureCards: FeatureCardItem[];
  serviceCards: ServiceCardItem[];
  temples: TempleItem[];
  partnerSection: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
  };
  promoBanner?: {
    isVisible: boolean;
    imageUrl: string;
    link: string;
    title: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/v1';

export function useHomepageConfig() {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/settings/homepage`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          }
        });
        const json = await res.json();
        if (!cancelled && json?.data) {
          setConfig(json.data);
        }
      } catch {
        // Config unavailable — components use built-in defaults
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isSectionVisible = (key: string): boolean => {
    if (!config?.sections?.[key]) return true; // default visible
    return config.sections[key].isVisible;
  };

  return { config, isLoading, isSectionVisible };
}
