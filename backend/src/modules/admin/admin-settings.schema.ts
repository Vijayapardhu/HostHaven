import { z } from 'zod'

export const payoutFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY'])

export const bookingSettingsSchema = z.object({
  autoConfirmBookings: z.boolean(),
  maxAdvanceBookingDays: z.coerce.number().int().min(1).max(365),
  cancellationWindowHours: z.coerce.number().int().min(1).max(720),
  allowInstantRefunds: z.boolean(),
})

export const seoSettingsSchema = z.object({
  metaTitle: z.string().min(2).max(120),
  metaDescription: z.string().min(10).max(320),
  indexable: z.boolean(),
  canonicalBaseUrl: z.string().optional(),
})

export const socialSettingsSchema = z.object({
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  xUrl: z.string().optional(),
})

export const contactDetailsSettingsSchema = z.object({
  supportEmail: z.string().email(),
  supportPhone: z.string().min(10).max(20),
  supportAddress: z.string().min(5).max(300),
  supportHours: z.string().min(2).max(120),
  supportCompanyName: z.string().min(2).max(120),
})

export const advancedSettingsSchema = z.object({
  booking: bookingSettingsSchema,
  seo: seoSettingsSchema,
  social: socialSettingsSchema,
  contact: contactDetailsSettingsSchema.optional(),
})

export const platformSettingsSchema = z.object({
  platformName: z.string().min(2).max(120),
  commissionRate: z.coerce.number().min(0).max(100),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(10).max(20),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  minPayoutAmount: z.coerce.number().min(0),
  payoutFrequency: payoutFrequencySchema,
  allowedCities: z.union([z.array(z.string()), z.undefined()]),
  defaultState: z.string().optional(),
  emailTemplates: z.array(z.any()).optional(),
  featureFlags: z.any().optional(),
  advancedSettings: advancedSettingsSchema.optional(),
  vendorRegistrationFee: z.coerce.number().min(0).default(0),
})

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>
