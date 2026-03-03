import api from './api'

export type PayoutFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  trigger: string
  isActive: boolean
}

export interface FeatureFlag {
  id: string
  name: string
  description: string
  isEnabled: boolean
}

export interface BannerSlide {
  id: string
  title: string
  subtitle: string
  tags: string
  ctaText: string
  ctaLink: string
  imageUrl: string
  isActive: boolean
}

export interface DestinationItem {
  id: string
  name: string
  imageUrl: string
  link: string
  isActive: boolean
}

export interface FeatureCardItem {
  id: string
  icon: string
  title: string
  description: string
  badge?: string
  link?: string
  isActive: boolean
}

export interface ServiceCardItem {
  id: string
  icon: string
  title: string
  description: string
  link: string
  isActive: boolean
}

export interface TempleItem {
  id: string
  name: string
  location: string
  imageUrl: string
  link: string
  isActive: boolean
}

export interface SectionConfig {
  isVisible: boolean
  order: number
}

export interface HomepageConfig {
  sections: Record<string, SectionConfig>
  bannerSlides: BannerSlide[]
  destinations: DestinationItem[]
  featureCards: FeatureCardItem[]
  serviceCards: ServiceCardItem[]
  temples: TempleItem[]
  partnerSection: {
    title: string
    subtitle: string
    ctaText: string
    ctaLink: string
  }
  promoBanner?: {
    isVisible: boolean
    imageUrl: string
    link: string
    title: string
  }
}

export interface PlatformSettings {
  platformName: string
  commissionRate: number
  supportEmail: string
  supportPhone: string
  emailNotifications: boolean
  pushNotifications: boolean
  minPayoutAmount: number
  payoutFrequency: PayoutFrequency
  emailTemplates?: EmailTemplate[]
  featureFlags?: FeatureFlag[]
}

export const settingsService = {
  getSettings: async () => {
    const response = await api.get<PlatformSettings>('/v1/admin/settings')
    return response.data?.data ?? response.data
  },

  updateSettings: async (payload: PlatformSettings) => {
    const response = await api.put<PlatformSettings>('/v1/admin/settings', payload)
    return response.data?.data ?? response.data
  },

  getHomepageConfig: async (): Promise<HomepageConfig> => {
    const response = await api.get('/v1/admin/settings/homepage')
    return response.data?.data ?? response.data
  },

  updateHomepageConfig: async (config: HomepageConfig): Promise<HomepageConfig> => {
    const response = await api.put('/v1/admin/settings/homepage', config)
    return response.data?.data ?? response.data
  },
}
