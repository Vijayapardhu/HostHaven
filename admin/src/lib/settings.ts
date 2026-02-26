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
}
