import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const normalizeUpperCase = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

const normalizeCityValue = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  return value.trim().toUpperCase();
};

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const propertyApprovalSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "REJECTED", "DRAFT", "PENDING"]),
  reason: z.string().max(500).optional(),
});

export const systemStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

import { PropertyType, PropertyStatus } from '@prisma/client';

const statusEnum = z.enum(Object.values(PropertyStatus) as [string, ...string[]]);
const typeEnum = z.enum(Object.values(PropertyType) as [string, ...string[]]);
const cityEnum = z.string().min(1);
const cancellationPolicyEnum = z.enum([
  "FREE_CANCELLATION",
  "MODERATE",
  "STRICT",
  "NON_REFUNDABLE",
]);
const imageInputSchema = z.union([
  z.string().url(),
  z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    isPrimary: z.boolean().optional(),
  }),
]);
const videoInputSchema = z.union([
  z.string().url(),
  z.object({
    url: z.string().url(),
    title: z.string().optional(),
  }).passthrough(),
]);
const normalizeAmenityValue = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.name === "string") return record.name.trim();
    if (typeof record.label === "string") return record.label.trim();
    if (typeof record.value === "string") return record.value.trim();
    if (typeof record.url === "string") return record.url.trim();
  }
  return value;
};
const roomInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.preprocess(emptyStringToUndefined, z.string().min(1).max(200).optional()),
  roomName: z.preprocess(emptyStringToUndefined, z.string().min(1).max(200).optional()),
  description: z.preprocess(emptyStringToUndefined, z.string().max(5000).optional()),
  type: z.preprocess(emptyStringToUndefined, z.string().max(100).optional()),
  capacity: z.coerce.number().int().positive().optional(),
  extraBedCapacity: z.coerce.number().int().nonnegative().optional(),
  sizeSqm: z.coerce.number().positive().optional(),
  pricePerNight: z.coerce.number().positive(),
  weekendPrice: z.coerce.number().positive().optional().nullable(),
  seasonalPricing: z.any().optional(),
  amenities: z.array(z.preprocess(normalizeAmenityValue, z.string())).optional(),
  roomAmenities: z.array(z.preprocess(normalizeAmenityValue, z.string())).optional(),
  images: z.array(imageInputSchema).optional(),
  roomImages: z.array(z.string().url()).optional(),
  video: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  totalRooms: z.coerce.number().int().positive().optional(),
  availableRooms: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
const detailedCancellationPolicySchema = z.object({
  freeBeforeHours: z.coerce.number().int().nonnegative(),
  refundPercentBefore: z.coerce.number().min(0).max(100),
  refundPercentAfter: z.coerce.number().min(0).max(100),
});
const templeDetailsSchema = z.object({
  deity: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  templeType: z.preprocess(emptyStringToUndefined, z.string().optional()),
  builtYear: z.preprocess(emptyStringToUndefined, z.string().optional()),
  architecture: z.preprocess(emptyStringToUndefined, z.string().optional()),
  searchText: z.preprocess(emptyStringToUndefined, z.string().optional()),
  darshanTimings: z.any().optional(),
  aartiTimings: z.any().optional(),
  specialEvents: z.any().optional(),
  dressCode: z.preprocess(emptyStringToUndefined, z.string().optional()),
  entryFee: z.any().optional(),
  photography: z.boolean().optional(),
  bestTimeToVisit: z.preprocess(emptyStringToUndefined, z.string().optional()),
  festivals: z.any().optional(),
}).partial();

export const adminFilterSchema = z
  .object({
    status: statusEnum.optional(),
    type: typeEnum.optional(),
    city: z.preprocess(normalizeCityValue, cityEnum.optional()),
    vendorId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().min(1).max(100).default(10),
  })
  .transform((data) => ({
    ...data,
    status: data.status?.toUpperCase() as
      | "ACTIVE"
      | "INACTIVE"
      | "REJECTED"
      | "PENDING"
      | "DRAFT"
      | undefined,
    type: data.type?.toUpperCase() as "HOTEL" | "HOME" | "TEMPLE" | undefined,
  }));

export const payoutProcessingSchema = z.object({
  payoutId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(500).optional(),
});

export const createPayoutSchema = z.object({
  vendorId: z.string().uuid("Invalid vendor ID"),
  amount: z.coerce.number().positive().optional(),
});

export const paymentRefundSchema = z.object({
  amount: z.coerce.number().positive("Refund amount must be positive"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

export const bookingRefundSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const markPayoutPaidSchema = z.object({
  transactionId: z.string()
    .min(3, "Transaction ID must be at least 3 characters")
    .max(120, "Transaction ID must not exceed 120 characters")
    .regex(/^[A-Za-z0-9\-_]+$/, "Transaction ID can only contain alphanumeric characters, hyphens, and underscores"),
  notes: z.string().max(500).optional(),
  paymentScreenshot: z.string().url().optional(),
});

export const financeListFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(10),
  status: z.preprocess(emptyStringToUndefined, z.string().max(50).optional()),
  search: z.preprocess(emptyStringToUndefined, z.string().max(120).optional()),
  vendorId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  bookingId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  startDate: z.preprocess(emptyStringToUndefined, z.string().datetime().optional()),
  endDate: z.preprocess(emptyStringToUndefined, z.string().datetime().optional()),
});

export const adminRoomUpdateSchema = z.object({
  pricePerNight: z.coerce.number().positive().optional(),
  weekendPrice: z.coerce.number().positive().optional(),
  totalRooms: z.coerce.number().int().nonnegative().optional(),
  availableRooms: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional()
});

export const adminRoomBlockSchema = z.object({
  checkInDate: z.string().transform((str) => new Date(str)),
  checkOutDate: z.string().transform((str) => new Date(str)),
  quantity: z.coerce.number().int().positive().default(1),
  notes: z.string().max(200).optional(),
});

export const analyticsSchema = z.object({
  range: z.enum(["7d", "30d", "3m"]).default("30d"),
});

export const adminUpdateVendorSchema = z.object({
  name: z.preprocess(
    emptyStringToUndefined,
    z.string().min(2).max(100).optional(),
  ),
  email: z.preprocess(emptyStringToUndefined, z.string().email().optional()),
  phone: z.preprocess(
    emptyStringToUndefined,
    z.string().regex(/^[6-9]\d{9}$/).optional(),
  ),
  businessName: z.preprocess(
    emptyStringToUndefined,
    z.string().min(2).max(200).optional(),
  ),
  businessAddress: z.preprocess(
    emptyStringToUndefined,
    z.string().max(500).optional(),
  ),
  gstNumber: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
      .optional(),
  ),
  panNumber: z.preprocess(
    emptyStringToUndefined,
    z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  ),
  aadhaarNumber: z.preprocess(
    emptyStringToUndefined,
    z.string().regex(/^\d{12}$/).optional(),
  ),
  passportPhoto: z.preprocess(
    emptyStringToUndefined,
    z.string().url().optional(),
  ),
  companyLogo: z.preprocess(
    emptyStringToUndefined,
    z.string().url().optional(),
  ),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  bankAccount: z.object({
    bankName: z.preprocess(emptyStringToUndefined, z.string().min(2).max(100)),
    accountNumber: z.preprocess(
      emptyStringToUndefined,
      z.string().min(9).max(18),
    ),
    ifscCode: z.preprocess(
      emptyStringToUndefined,
      z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    ),
    accountHolderName: z.preprocess(
      emptyStringToUndefined,
      z.string().min(2).max(100),
    ),
  }).optional(),
});

export const adminUpdatePropertySchema = z.object({
  name: z.preprocess(
    emptyStringToUndefined,
    z.string().min(2).max(200).optional(),
  ),
  slug: z.preprocess(
    emptyStringToUndefined,
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  ),
  type: z.preprocess(normalizeUpperCase, typeEnum.optional()),
  status: z.preprocess(normalizeUpperCase, statusEnum.optional()),
  description: z.preprocess(
    emptyStringToUndefined,
    z.string().min(10).max(5000).optional(),
  ),
  shortDesc: z.preprocess(
    emptyStringToUndefined,
    z.string().max(200).optional(),
  ),
  address: z.preprocess(
    emptyStringToUndefined,
    z.string().min(5).max(500).optional(),
  ),
  city: z.preprocess(normalizeCityValue, cityEnum.optional()),
  state: z.preprocess(
    emptyStringToUndefined,
    z.string().min(2).max(100).optional(),
  ),
  pincode: z.preprocess(
    emptyStringToUndefined,
    z.string().regex(/^[1-9][0-9]{5}$/).optional(),
  ),
  searchText: z.preprocess(emptyStringToUndefined, z.string().max(5000).optional()),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  basePrice: z.coerce.number().positive().optional(),
  currency: z.preprocess(emptyStringToUndefined, z.string().min(1).max(10).optional()),
  vendorId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional().nullable()),
  amenities: z.array(z.preprocess(normalizeAmenityValue, z.string())).optional(),
  images: z.array(imageInputSchema).optional(),
  videos: z.array(videoInputSchema).optional(),
  virtualTourUrl: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  highlights: z.array(z.preprocess(normalizeAmenityValue, z.string())).optional(),
  featureFlags: z.record(z.any()).optional(),
  houseDetails: z.record(z.any()).optional(),
  rooms: z.array(roomInputSchema).optional(),
  templeDetails: templeDetailsSchema.optional().nullable(),
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  metaTitle: z.preprocess(
    emptyStringToUndefined,
    z.string().max(100).optional(),
  ),
  metaDesc: z.preprocess(
    emptyStringToUndefined,
    z.string().max(200).optional(),
  ),
  cancellationPolicy: z.union([cancellationPolicyEnum, detailedCancellationPolicySchema]).optional(),
});

export const adminCreatePropertySchema = adminUpdatePropertySchema.extend({
  name: z.string().min(2).max(200),
  type: z.preprocess(normalizeUpperCase, typeEnum),
  description: z.string().min(10).max(5000),
  address: z.string().min(5).max(500),
  city: z.preprocess(normalizeCityValue, cityEnum),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  basePrice: z.coerce.number().positive(),
  images: z.array(imageInputSchema).min(1).max(20),
  amenities: z.array(z.string()).default([]),
});

export const adminUpdatePropertyCancellationSchema = z.object({
  cancellationPolicy: cancellationPolicyEnum,
});

const dateStringSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Invalid date",
);

export const adminRoomInventoryQuerySchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
});

export const adminRoomInventoryOverrideSchema = z.object({
  date: dateStringSchema,
  availableRooms: z.coerce.number().int().nonnegative(),
});

const cmsAudienceSchema = z.enum(["user", "vendor"]);

export const cmsPageIdSchema = z.object({
  id: z.string().min(1),
});

export const createCmsPageSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().min(1).max(180),
  audience: cmsAudienceSchema,
  summary: z.string().max(500).optional(),
  content: z.string().min(10).max(50000),
  coverImageUrl: z.string().url().optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(320).optional(),
  isPublished: z.boolean().default(false),
});

export const updateCmsPageSchema = createCmsPageSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const publicCmsPageParamSchema = z.object({
  audience: cmsAudienceSchema,
  slug: z.string().min(1),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type PropertyApprovalInput = z.infer<typeof propertyApprovalSchema>;
export type SystemStatsInput = z.infer<typeof systemStatsSchema>;
export type AdminFilterInput = z.infer<typeof adminFilterSchema>;
export type PayoutProcessingInput = z.infer<typeof payoutProcessingSchema>;
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
export type PaymentRefundInput = z.infer<typeof paymentRefundSchema>;
export type BookingRefundInput = z.infer<typeof bookingRefundSchema>;
export type MarkPayoutPaidInput = z.infer<typeof markPayoutPaidSchema>;
export type FinanceListFilterInput = z.infer<typeof financeListFilterSchema>;
export type AdminRoomUpdateInput = z.infer<typeof adminRoomUpdateSchema>;
export type AdminRoomBlockInput = z.infer<typeof adminRoomBlockSchema>;
export type AnalyticsInput = z.infer<typeof analyticsSchema>;
export type AdminUpdateVendorInput = z.infer<typeof adminUpdateVendorSchema>;
export type AdminCreatePropertyInput = z.infer<typeof adminCreatePropertySchema>;
export type AdminUpdatePropertyInput = z.infer<typeof adminUpdatePropertySchema>;
export type AdminUpdatePropertyCancellationInput = z.infer<typeof adminUpdatePropertyCancellationSchema>;
export type AdminRoomInventoryQueryInput = z.infer<typeof adminRoomInventoryQuerySchema>;
export type AdminRoomInventoryOverrideInput = z.infer<typeof adminRoomInventoryOverrideSchema>;
export type CreateCmsPageInput = z.infer<typeof createCmsPageSchema>;
export type UpdateCmsPageInput = z.infer<typeof updateCmsPageSchema>;
export type PublicCmsPageParamInput = z.infer<typeof publicCmsPageParamSchema>;

export const updateVendorCommissionSchema = z.object({
  rate: z.coerce.number().min(0).max(100).optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
})
  .refine(
    (data) => data.rate !== undefined || data.commissionRate !== undefined,
    { message: "rate is required" },
  )
  .transform((data) => ({ rate: data.rate ?? data.commissionRate! }));
export type UpdateVendorCommissionInput = z.infer<typeof updateVendorCommissionSchema>;
