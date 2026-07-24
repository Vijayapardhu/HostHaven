import { z } from 'zod';
import { paginationSchema } from '../../utils/validators.util';

// Stay dates accept either a plain calendar date (`2026-08-01`, preferred) or
// a full ISO timestamp from older clients. Both are normalised to UTC midnight
// server-side — see utils/date.util.ts.
const stayDate = z
  .string()
  .refine(
    (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value)),
    { message: 'Must be a calendar date (YYYY-MM-DD) or an ISO timestamp' },
  );

export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  checkInDate: stayDate,
  checkOutDate: stayDate,
  adults: z.coerce.number().int().min(1).max(20).default(1),
  children: z.coerce.number().int().min(0).max(10).default(0),
  extraBeds: z.coerce.number().int().min(0).max(5).default(0),
  specialRequests: z.string().max(1000).optional(),
  // Only `name` is consumed downstream (the vendor's arrivals list). Age and
  // gender are optional so the checkout can send the primary guest's name
  // without fabricating demographic data it never collected.
  guestDetails: z.array(z.object({
    name: z.string().min(2).max(100),
    age: z.coerce.number().int().min(0).max(120).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    idProof: z.string().optional(),
  })).optional(),
  guestPhone: z.string().regex(/^\d{10}$/).optional(),
  couponCode: z.string().trim().min(1).max(40).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const bookingFilterSchema = paginationSchema.extend({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'CHECKED_OUT',
    'CANCELLED',
    'NO_SHOW',
    'REFUNDED'
  ]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z)?)?$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z)?)?$/).optional(),
});

export const bookingIdSchema = z.object({
  id: z.string().uuid(),
});

export const checkPriceSchema = z.object({
  propertyId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  checkIn: stayDate,
  checkOut: stayDate,
  guests: z.coerce.number().int().min(1).default(1),
  extraBeds: z.coerce.number().int().min(0).default(0),
});

// Vendor-operated walk-in booking. Deliberately carries no amount: the total
// is derived from the room's nightly rate so a vendor cannot self-declare the
// value of a booking they will later be paid out for.
export const quickBookingSchema = z.object({
  propertyId: z.string().uuid(),
  roomId: z.string().uuid(),
  guestName: z.string().min(2).max(120),
  guestPhone: z.string().min(6).max(20),
  guestEmail: z.string().email().optional(),
  checkInDate: stayDate,
  checkOutDate: stayDate,
  adults: z.coerce.number().int().min(1).max(30),
  children: z.coerce.number().int().min(0).max(30).optional(),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "RAZORPAY"]),
  isOnline: z.boolean().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type QuickBookingInput = z.infer<typeof quickBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type BookingFilterInput = z.infer<typeof bookingFilterSchema>;
export type CheckPriceInput = z.infer<typeof checkPriceSchema>;
