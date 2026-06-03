import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { api } from "@/lib/api";

interface SEOSettings {
  platformName: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    indexable: boolean;
    canonicalBaseUrl: string;
  };
  social: Record<string, string>;
}

interface SEOContextType {
  settings: SEOSettings | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_SEO_SETTINGS: SEOSettings = {
  platformName: "HostHaven",
  seo: {
    metaTitle: "HostHaven",
    metaDescription: "Book trusted hotels, homestays, and travel experiences with HostHaven.",
    indexable: true,
    canonicalBaseUrl: "https://hosthaven.in",
  },
  social: {},
};

const SEOContext = createContext<SEOContextType | undefined>(undefined);

export const SEOProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SEOSettings | null>(DEFAULT_SEO_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSEOSettings = async () => {
      try {
        const response = await api.seo.getSettings();
        if (response) {
          setSettings(response);
        }
      } catch (err) {
        console.warn("Failed to fetch SEO settings, using defaults:", err);
        setError("Failed to load SEO settings");
        // Keep using default settings
      } finally {
        setIsLoading(false);
      }
    };

    fetchSEOSettings();
  }, []);

  return (
    <SEOContext.Provider value={{ settings, isLoading, error }}>
      {children}
    </SEOContext.Provider>
  );
};

export const useSEO = (): SEOContextType => {
  const context = useContext(SEOContext);
  if (context === undefined) {
    // Return default values if used outside provider (graceful fallback)
    return {
      settings: DEFAULT_SEO_SETTINGS,
      isLoading: false,
      error: null,
    };
  }
  return context;
};

export default SEOContext;
