import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSEO } from "@/contexts/SEOContext";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_OG_IMAGE = "/logo.png";

const SEOHead = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonical,
  noindex,
  jsonLd,
}: SEOHeadProps) => {
  const { pathname } = useLocation();
  const { settings } = useSEO();

  // Use database settings as defaults, with props as overrides
  const siteName = settings?.platformName || "HostHaven";
  const siteUrl = settings?.seo?.canonicalBaseUrl || "https://hosthaven.in";
  const defaultDescription = settings?.seo?.metaDescription || 
    "Find and book hotels, homes, and unique stays in Andhra Pradesh. Explore sacred temples, travel services, and heritage destinations.";
  const globalIndexable = settings?.seo?.indexable ?? true;

  // Final values (props override database defaults)
  const finalDescription = description || defaultDescription;
  const finalOgImage = ogImage || DEFAULT_OG_IMAGE;
  const finalNoindex = noindex !== undefined ? noindex : !globalIndexable;

  const fullTitle = title 
    ? `${title} | ${siteName}` 
    : `${siteName} - Book Hotels & Homes in Andhra Pradesh`;
  const canonicalUrl = canonical || `${siteUrl}${pathname}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", finalDescription);
    if (keywords) setMeta("name", "keywords", keywords);
    if (finalNoindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      setMeta("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1");
    }

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", finalDescription);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image", finalOgImage.startsWith("http") ? finalOgImage : `${siteUrl}${finalOgImage}`);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:site_name", siteName);
    setMeta("property", "og:locale", "en_IN");

    // Twitter
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", finalDescription);
    setMeta("name", "twitter:image", finalOgImage.startsWith("http") ? finalOgImage : `${siteUrl}${finalOgImage}`);
    setMeta("name", "twitter:card", "summary_large_image");

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // JSON-LD
    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
    existingScripts.forEach((s) => s.remove());

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((data) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "true");
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }

    return () => {
      const scripts = document.querySelectorAll('script[data-seo-jsonld]');
      scripts.forEach((s) => s.remove());
    };
  }, [fullTitle, finalDescription, keywords, finalOgImage, ogType, canonicalUrl, finalNoindex, jsonLd, siteName, siteUrl]);

  return null;
};

export default SEOHead;
