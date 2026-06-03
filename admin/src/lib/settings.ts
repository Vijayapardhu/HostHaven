import api from "./api";

export type PayoutFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
export type CmsAudience = "user" | "vendor";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  trigger: string;
  isActive: boolean;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

export interface BookingSettings {
  autoConfirmBookings: boolean;
  maxAdvanceBookingDays: number;
  cancellationWindowHours: number;
  allowInstantRefunds: boolean;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  indexable: boolean;
  canonicalBaseUrl?: string;
}

export interface SocialSettings {
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  xUrl?: string;
}

export interface AdvancedSettings {
  booking: BookingSettings;
  seo: SeoSettings;
  social: SocialSettings;
  contact?: {
    supportEmail: string;
    supportPhone: string;
    supportAddress: string;
    supportHours: string;
    supportCompanyName: string;
  };
  tax?: {
    enabled: boolean;
    percent: number;
  };
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  booking: {
    autoConfirmBookings: false,
    maxAdvanceBookingDays: 120,
    cancellationWindowHours: 24,
    allowInstantRefunds: false,
  },
  seo: {
    metaTitle: "HostHaven",
    metaDescription:
      "Book trusted hotels, homes, and travel experiences with HostHaven.",
    indexable: true,
  },
  social: {},
  contact: {
    supportEmail: "support@hosthaven.com",
    supportPhone: "+91 1800 123 4567",
    supportAddress: "Vijayawada, Andhra Pradesh, India",
    supportHours: "24/7 Customer Support",
    supportCompanyName: "HostHaven Travels Pvt. Ltd.",
  },
  tax: {
    enabled: false,
    percent: 12,
  },
};

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

export interface PlatformSettings {
  platformName: string;
  commissionRate: number;
  supportEmail: string;
  supportPhone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  minPayoutAmount: number;
  payoutFrequency: PayoutFrequency;
  allowedCities?: string[];
  defaultState?: string;
  emailTemplates?: EmailTemplate[];
  featureFlags?: FeatureFlag[];
  advancedSettings?: AdvancedSettings;
  vendorRegistrationFee?: number;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  audience: CmsAudience;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CmsPagePayload {
  title: string;
  slug: string;
  audience: CmsAudience;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
}

export type UpdateCmsPagePayload = Partial<CmsPagePayload>;

const unwrapData = <T>(response: any): T => response.data?.data ?? response.data;

const withDefaults = (settings: PlatformSettings): PlatformSettings => ({
  ...settings,
  advancedSettings: settings.advancedSettings ?? DEFAULT_ADVANCED_SETTINGS,
  emailTemplates: settings.emailTemplates ?? [],
  featureFlags: settings.featureFlags ?? [],
});

export const settingsService = {
  getSettings: async (): Promise<PlatformSettings> => {
    const response = await api.get<PlatformSettings>("/v1/admin/settings");
    return withDefaults(unwrapData<PlatformSettings>(response));
  },

  updateSettings: async (
    payload: PlatformSettings,
  ): Promise<PlatformSettings> => {
    const response = await api.put<PlatformSettings>(
      "/v1/admin/settings",
      payload,
    );
    return withDefaults(unwrapData<PlatformSettings>(response));
  },

  getHomepageConfig: async (): Promise<HomepageConfig> => {
    const response = await api.get("/v1/admin/settings/homepage");
    return unwrapData<HomepageConfig>(response);
  },

  updateHomepageConfig: async (config: HomepageConfig): Promise<HomepageConfig> => {
    const response = await api.put("/v1/admin/settings/homepage", config);
    return unwrapData<HomepageConfig>(response);
  },

  getCmsPages: async (): Promise<CmsPage[]> => {
    const response = await api.get("/v1/admin/cms/pages");
    return unwrapData<CmsPage[]>(response);
  },

  createCmsPage: async (payload: CmsPagePayload): Promise<CmsPage> => {
    const response = await api.post("/v1/admin/cms/pages", payload);
    return unwrapData<CmsPage>(response);
  },

  updateCmsPage: async (
    id: string,
    payload: UpdateCmsPagePayload,
  ): Promise<CmsPage> => {
    const response = await api.put(`/v1/admin/cms/pages/${id}`, payload);
    return unwrapData<CmsPage>(response);
  },

  deleteCmsPage: async (id: string): Promise<{ id: string; deleted: boolean }> => {
    const response = await api.delete(`/v1/admin/cms/pages/${id}`);
    return unwrapData<{ id: string; deleted: boolean }>(response);
  },
};
