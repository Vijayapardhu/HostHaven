import { z } from 'zod'

// Stay dates accept either a plain calendar date (`2026-08-01`, preferred) or
// a full ISO timestamp from older clients. Both are normalised to UTC midnight
// server-side — see utils/date.util.ts.
const stayDate = z
  .string()
  .refine(
    (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value)),
    { message: 'Must be a calendar date (YYYY-MM-DD) or an ISO timestamp' },
  )

export const inventoryLockSchema = z.object({
  roomId: z.string().uuid(),
  checkIn: stayDate,
  checkOut: stayDate,
  quantity: z.coerce.number().int().positive().default(1),
})

export const inventoryReleaseSchema = z.object({
  roomId: z.string().uuid(),
  // Optional, but supplying them scopes the release to one stay rather than
  // dropping every lock the caller holds on the room.
  checkIn: stayDate.optional(),
  checkOut: stayDate.optional(),
})

export const inventoryQuerySchema = z.object({
  roomId: z.string().uuid(),
  date: stayDate,
})

export type InventoryLockInput = z.infer<typeof inventoryLockSchema>
export type InventoryReleaseInput = z.infer<typeof inventoryReleaseSchema>
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>
