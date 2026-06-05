import { useState, useEffect } from 'react';
import { handleError } from '../lib/errorHandler';

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
  propertyCount?: number;
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
  slug?: string;
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
  pageBackground?: string;
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

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const API_URL = `${BASE_URL}/v1`;

const EMPTY_CONFIG: HomepageConfig = {
  pageBackground: "",
  sections: {
    banner: { isVisible: true, order: 0 },
    hero: { isVisible: true, order: 1 },
    search: { isVisible: true, order: 2 },
    promoBanner: { isVisible: true, order: 3 },
    features: { isVisible: true, order: 4 },
    destinations: { isVisible: true, order: 5 },
    recommendations: { isVisible: true, order: 6 },
    temples: { isVisible: true, order: 7 },
    services: { isVisible: true, order: 8 },
    becomePartner: { isVisible: true, order: 9 },
  },
  bannerSlides: [],
  destinations: [],
  featureCards: [],
  serviceCards: [],
  temples: [],
  partnerSection: { title: "", subtitle: "", ctaText: "", ctaLink: "" },
  promoBanner: { isVisible: true, imageUrl: "", link: "/", title: "" },
};

export function useHomepageConfig() {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

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
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const json = await res.json();
        
        if (!cancelled && json?.data && typeof json.data === "object") {
          const data = json.data as HomepageConfig;
          setConfig({
            ...EMPTY_CONFIG,
            ...data,
            sections: {
              ...EMPTY_CONFIG.sections,
              ...(data.sections || {}),
            },
          });
          setHasLoaded(true);
        }
      } catch (error) {
        handleError(error, 'api');
      } finally {
        if (!cancelled) {
          setConfig((prev) => prev ?? EMPTY_CONFIG);
          setHasLoaded(true);
          setIsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isSectionVisible = (key: string): boolean => {
    if (!hasLoaded || !config) return false;
    if (!config.sections) return true;
    if (!config.sections[key]) return true;
    return config.sections[key].isVisible !== false;
  };

  return { config: hasLoaded ? config : null, isLoading, isSectionVisible };
}
