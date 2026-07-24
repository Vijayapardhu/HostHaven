const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export interface PublicContactSettings {
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
  supportHours: string;
  supportCompanyName: string;
}

export interface PublicTaxSettings {
  enabled: boolean;
  percent: number;
}

export interface PublicColorsSettings {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  heritage: string;
}

export interface PublicPlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  contact: PublicContactSettings;
  social?: {
    facebookUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    xUrl?: string;
  };
  tax?: PublicTaxSettings;
  colors?: PublicColorsSettings;
}

export const DEFAULT_COLORS: PublicColorsSettings = {
  primary: "205 65% 18%", // deep navy — main buttons, header, selected states
  secondary: "40 30% 90%", // warm cream
  accent: "36 90% 51%", // heritage gold — highlights, rings, gradients
  background: "40 25% 94%", // cream page background
  foreground: "205 45% 16%", // navy ink text
  card: "40 40% 98%", // ivory card surface
  heritage: "205 60% 15%", // deep navy overlays
};

export const DEFAULT_PUBLIC_SETTINGS: PublicPlatformSettings = {
  platformName: 'HostHaven',
  supportEmail: 'support@hosthaven.com',
  supportPhone: '+91 1800 123 4567',
  contact: {
    supportEmail: 'support@hosthaven.com',
    supportPhone: '+91 1800 123 4567',
    supportAddress: 'Vijayawada, Andhra Pradesh, India',
    supportHours: '24/7 Customer Support',
    supportCompanyName: 'HostHaven Travels Pvt. Ltd.',
  },
  social: {},
  colors: DEFAULT_COLORS,
};

// Module-level cache so that the many components using this endpoint
// (ThemeInjector, Header, Footer, Index, …) share a single network request
// instead of each refetching on mount — which previously flooded the API and
// tripped rate limiting. Cleared on full page reload, so admin changes still
// surface without a hard cache.
let cachedSettings: PublicPlatformSettings | null = null;
let inflightRequest: Promise<PublicPlatformSettings> | null = null;

export async function getPublicPlatformSettings(
  forceRefresh = false,
): Promise<PublicPlatformSettings> {
  if (cachedSettings && !forceRefresh) return cachedSettings;
  if (inflightRequest && !forceRefresh) return inflightRequest;

  const request = (async (): Promise<PublicPlatformSettings> => {
    try {
      const response = await fetch(`${BASE_URL}/v1/settings/public`, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const next: PublicPlatformSettings = json?.data ?? DEFAULT_PUBLIC_SETTINGS;
      cachedSettings = next;
      return next;
    } catch {
      // Reuse a prior good value if we have one; otherwise fall back.
      return cachedSettings ?? DEFAULT_PUBLIC_SETTINGS;
    } finally {
      inflightRequest = null;
    }
  })();

  inflightRequest = request;
  return request;
}
