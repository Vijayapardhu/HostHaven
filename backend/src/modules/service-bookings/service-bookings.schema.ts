import { z } from 'zod';

// The client supplies selections only. Pricing is derived server-side from the
// Service row, and payment state comes solely from a verified Razorpay
// signature or webhook — never from the request body.
export const createServiceBookingSchema = z.object({
  serviceId: z.string().uuid(),
  serviceDate: z.string().datetime(),
  serviceTime: z.string().min(3).max(20),
  location: z.string().min(5).max(300),
  notes: z.string().max(2000).optional(),
});

export const serviceBookingFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'ADVANCE_PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const updateServiceBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'ADVANCE_PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  cancellationReason: z.string().max(500).optional(),
});

export const serviceBookingRefundSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().max(500).optional(),
});

export const serviceBookingIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateServiceBookingInput = z.infer<typeof createServiceBookingSchema>;
