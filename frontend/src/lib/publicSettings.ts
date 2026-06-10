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
  primary: "38 92% 50%",
  secondary: "40 30% 90%",
  accent: "30 80% 55%",
  background: "40 25% 94%",
  foreground: "30 10% 15%",
  card: "40 40% 98%",
  heritage: "30 25% 25%",
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

export async function getPublicPlatformSettings(): Promise<PublicPlatformSettings> {
  try {
    const response = await fetch(`${BASE_URL}/v1/settings/public`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    return json?.data ?? DEFAULT_PUBLIC_SETTINGS;
  } catch {
    return DEFAULT_PUBLIC_SETTINGS;
  }
}
