import { z } from "zod";

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const propertyApprovalSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

export const systemStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const statusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "REJECTED",
  "PENDING",
  "DRAFT",
]);
const typeEnum = z.enum(["HOTEL", "HOME", "TEMPLE"]);

export const adminFilterSchema = z
  .object({
    status: statusEnum.optional(),
    type: typeEnum.optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
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

export const bookingRefundSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const markPayoutPaidSchema = z.object({
  transactionId: z.string().min(3).max(120),
  notes: z.string().max(500).optional(),
});

export const inventoryOverrideSchema = z.object({
  availableRooms: z.coerce.number().int().nonnegative(),
});

export const analyticsSchema = z.object({
  range: z.enum(["7d", "30d", "3m"]).default("30d"),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type PropertyApprovalInput = z.infer<typeof propertyApprovalSchema>;
export type SystemStatsInput = z.infer<typeof systemStatsSchema>;
export type AdminFilterInput = z.infer<typeof adminFilterSchema>;
export type PayoutProcessingInput = z.infer<typeof payoutProcessingSchema>;
export type BookingRefundInput = z.infer<typeof bookingRefundSchema>;
export type MarkPayoutPaidInput = z.infer<typeof markPayoutPaidSchema>;
export type InventoryOverrideInput = z.infer<typeof inventoryOverrideSchema>;
export type AnalyticsInput = z.infer<typeof analyticsSchema>;
